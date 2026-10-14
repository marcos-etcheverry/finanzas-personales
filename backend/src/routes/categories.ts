import http from 'http';
import fs from 'fs';
import path from 'path';
import { db } from '../db';

// Helper para parsear el cuerpo JSON de las peticiones
function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

export async function handleCategoriesRoutes(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<boolean> {
  if (!pathname.startsWith('/api/categories')) {
    return false;
  }

  const categoryIdMatch = pathname.match(/^\/api\/categories\/(cat_.+)$/);
  const categoryUid = categoryIdMatch ? categoryIdMatch[1] : null;

  // --- GET /api/categories (Listar categorías activas ordenadas por posición) ---
  if (req.method === 'GET' && !categoryUid) {
    try {
      const categories = db.prepare(`
        SELECT uid, title, type, parent_uid, icon, color, position 
        FROM category 
        WHERE isRemoved = 0 
        ORDER BY position ASC, title ASC
      `).all();
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(categories));
    } catch (err: any) {
      console.error('[ERROR GET /api/categories]:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- POST /api/categories (Crear categoría principal o subcategoría) ---
  if (req.method === 'POST' && !categoryUid) {
    try {
      const body = await parseJsonBody(req);
      const { title, type, parent_uid, icon, color, position, imageBase64, imageName } = body;

      if (!title) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'El nombre de la categoría (title) es obligatorio.' }));
        return true;
      }

      let finalIcon = icon;
      if (imageBase64 && imageName) {
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const safeFileName = `cat_${Date.now()}_${imageName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const uploadPath = path.join(__dirname, '../../../web/uploads', safeFileName);
          
          fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
          fs.writeFileSync(uploadPath, buffer);
          
          finalIcon = `uploads/${safeFileName}`;
        }
      }

      const finalType = type || 'expense'; // 'income' o 'expense'
      const finalParentUid = (parent_uid && parent_uid.trim() !== '') ? parent_uid : null;
      
      // Calcular posición automática si no se provee
      const maxPosResult = db.prepare(`
        SELECT COALESCE(MAX(position), 0) as maxPos 
        FROM category 
        WHERE isRemoved = 0 AND COALESCE(parent_uid, '') = COALESCE(?, '')
      `).get(finalParentUid || '') as any;
      
      const finalPosition = position !== undefined ? position : (maxPosResult.maxPos + 1);

      const uid = 'cat_' + Date.now();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO category (uid, created, modified, title, type, parent_uid, icon, color, position, isRemoved)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(uid, now, now, title, finalType, finalParentUid, finalIcon || null, color || null, finalPosition);

      const newCategory = { 
        uid, title, type: finalType, parent_uid: finalParentUid, 
        icon: finalIcon, color, position: finalPosition 
      };

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newCategory));
    } catch (err: any) {
      console.error('[ERROR POST /api/categories]:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- PUT /api/categories/:id (Modificar categoría existente) ---
  if (req.method === 'PUT' && categoryUid) {
    try {
      const body = await parseJsonBody(req);
      const { title, type, parent_uid, color, position, imageBase64, imageName } = body;

      const category = db.prepare('SELECT * FROM category WHERE uid = ?').get(categoryUid) as any;
      if (!category) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Categoría no encontrada.' }));
        return true;
      }

      let finalIcon = category.icon;
      if (imageBase64 && imageName) {
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const safeFileName = `cat_${Date.now()}_${imageName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const uploadPath = path.join(__dirname, '../../../web/uploads', safeFileName);
          
          fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
          fs.writeFileSync(uploadPath, buffer);
          
          finalIcon = `uploads/${safeFileName}`;
        }
      }

      const finalTitle = title !== undefined ? title : category.title;
      const finalType = type !== undefined ? type : category.type;
      const finalParentUid = parent_uid !== undefined ? ((parent_uid && parent_uid.trim() !== '') ? parent_uid : null) : category.parent_uid;
      const finalColor = color !== undefined ? color : category.color;
      const finalPosition = position !== undefined ? position : category.position;
      const now = new Date().toISOString();

      db.prepare(`
        UPDATE category 
        SET modified = ?, title = ?, type = ?, parent_uid = ?, icon = ?, color = ?, position = ?
        WHERE uid = ?
      `).run(now, finalTitle, finalType, finalParentUid, finalIcon, finalColor, finalPosition, categoryUid);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, uid: categoryUid }));
    } catch (err: any) {
      console.error('[ERROR PUT /api/categories]:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- DELETE /api/categories/:id (Eliminación lógica) ---
  if (req.method === 'DELETE' && categoryUid) {
    try {
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE category SET isRemoved = 1, modified = ? WHERE uid = ?
      `).run(now, categoryUid);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err: any) {
      console.error('[ERROR DELETE /api/categories]:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  return false;
}