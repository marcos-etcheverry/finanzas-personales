import http from 'http';
import { db } from '../db';

export async function handleSettingsRoutes(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<boolean> {
  
  // GET /api/settings - Obtener todas las configuraciones
  if (req.method === 'GET' && pathname === '/api/settings') {
    try {
      const rows = db.prepare('SELECT key, value FROM settings').all();
      // Transformar array de clave-valor en un objeto plano para facilitar su uso en frontend
      const settingsObj: Record<string, string> = {};
      rows.forEach((row: any) => {
        settingsObj[row.key] = row.value;
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(settingsObj));
      return true;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
  }

  // POST /api/settings - Guardar o actualizar una configuración
  if (req.method === 'POST' && pathname === '/api/settings') {
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      const { key, value } = JSON.parse(body);

      if (!key || value === undefined) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Se requiere "key" y "value"' }));
        return true;
      }

      const stmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `);
      stmt.run(key, String(value));

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, key, value }));
      return true;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
  }

  return false;
}