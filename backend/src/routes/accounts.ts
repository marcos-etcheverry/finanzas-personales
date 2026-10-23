import http from 'http';
import fs from 'fs';
import path from 'path';
import { db } from '../db';

// Helper para parsear JSON (puedes importarlo de un utils o replicarlo de forma simple)
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

export async function handleAccountsRoutes(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<boolean> {
  if (!pathname.startsWith('/api/accounts')) {
    return false; // No es una ruta de cuentas, que lo maneje otro
  }

  const accountIdMatch = pathname.match(/^\/api\/accounts\/(acc_.+)$/);
  const accountUid = accountIdMatch ? accountIdMatch[1] : null;

  // --- GET /api/accounts ---
  if (req.method === 'GET' && !accountUid) {
    try {
const accounts = db.prepare(`
        SELECT 
          a.uid as id,
          a.uid, 
          a.title as name,
          a.title,
          a.type, -- <--- ¡Agregamos el tipo de cuenta aquí!
          a.currencyCode as currency,
          a.currencyCode,
          a.icon,
          a.color,
          a.include_in_balance,
          COALESCE(b.value, 0) as balance_cents,
          COALESCE(b.value, 0) as balance,
          a.position
        FROM account a
        LEFT JOIN account_balance b ON a.uid = b.account_uid
        WHERE a.isRemoved = 0 AND a.isActive = 1 
        ORDER BY a.position ASC
      `).all();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(accounts));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- POST /api/accounts ---
if (req.method === 'POST' && !accountUid) {
    try {
      const body = await parseJsonBody(req);
      const { title, name, type, currencyCode, currency, balance, closing_day, due_day, image_path, color, include_in_balance } = body;
      
      const finalTitle = title || name;
      const finalType = type || 'cash';
      const finalCurrency = currencyCode || currency || 'ARS';
      const finalBalance = balance !== undefined ? balance : 0;
      
      // Capturamos los campos específicos de tarjeta de crédito si existen
      const finalClosingDay = closing_day !== undefined ? closing_day : null;
      const finalDueDay = due_day !== undefined ? due_day : null;
      const finalImagePath = image_path || null;

      const uid = 'acc_' + Date.now();
      const now = new Date().toISOString();
      const nextPosition = 1;

      const createAccountTransaction = db.transaction(() => {
        // Asegúrate de incluir closing_day, due_day e image_path en tu sentencia INSERT de account
        db.prepare(`
          INSERT INTO account (uid, created, modified, title, type, currencyCode, closing_day, due_day, image_path, color, position, include_in_balance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(uid, now, now, finalTitle, finalType, finalCurrency, finalClosingDay, finalDueDay, finalImagePath, color || null, nextPosition, include_in_balance !== undefined ? include_in_balance : 1);

        const balUid = 'bal_' + Date.now();
        db.prepare(`
          INSERT INTO account_balance (uid, account_uid, value, updated_at)
          VALUES (?, ?, ?, ?)
        `).run(balUid, uid, finalBalance, now);

        return { 
          id: uid, uid, name: finalTitle, title: finalTitle, type: finalType,
          currency: finalCurrency, currencyCode: finalCurrency, 
          closing_day: finalClosingDay, due_day: finalDueDay, image_path: finalImagePath,
          balance: finalBalance, position: nextPosition, created: now 
        };
      });

      const newAccount = createAccountTransaction();
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newAccount));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }


// --- PUT /api/accounts/:id ---
  if (req.method === 'PUT' && accountUid) {
    try {
      const body = await parseJsonBody(req);
      const { name, type, currency, balance, initialBalance, color, include_in_balance, position, imageBase64, imageName } = body;

      const account = db.prepare('SELECT * FROM account WHERE uid = ?').get(accountUid) as any;
      if (!account) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Cuenta no encontrada.' }));
        return true;
      }

      let finalIcon = account.icon;
      if (imageBase64 && imageName) {
        const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          const safeFileName = `acc_${Date.now()}_${imageName.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const uploadPath = path.join(__dirname, '../../../web/uploads', safeFileName);
          fs.mkdirSync(path.dirname(uploadPath), { recursive: true });
          fs.writeFileSync(uploadPath, buffer);
          finalIcon = `uploads/${safeFileName}`;
        }
      }

      const finalName = name !== undefined ? name : account.title;
      const finalCurrency = currency !== undefined ? currency : account.currencyCode;
      const finalBalance = balance !== undefined ? balance : (initialBalance !== undefined ? initialBalance : null);
      const finalColor = color !== undefined ? color : account.color;
      const finalInclude = include_in_balance !== undefined ? include_in_balance : account.include_in_balance;
      const finalPosition = position !== undefined ? position : account.position;
      const now = new Date().toISOString();
      const finalType = type !== undefined ? type : account.type;
      // Usamos una transacción para actualizar ambos datos de forma segura
      const updateAccountTransaction = db.transaction(() => {
      db.prepare(`
        UPDATE account 
        SET modified = ?, title = ?, type = ?, currencyCode = ?, icon = ?, color = ?, include_in_balance = ?, position = ?
        WHERE uid = ?
      `).run(now, finalName, finalType, finalCurrency, finalIcon, finalColor, finalInclude, finalPosition, accountUid);

        // Si se envió un nuevo saldo, actualizamos la tabla account_balance
        if (finalBalance !== null) {
          db.prepare(`
            UPDATE account_balance 
            SET value = ?, updated_at = ?
            WHERE account_uid = ?
          `).run(finalBalance, now, accountUid);
        }
      });

      updateAccountTransaction();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, uid: accountUid }));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

 // --- DELETE /api/accounts/:id ---
  if (req.method === 'DELETE' && accountUid) {
    try {
      const deleteTransaction = db.transaction(() => {
        // 1. Opcional: limpiar registros hijos relacionados si existieran (ej. saldos o cuotas asociadas)
        db.prepare('DELETE FROM account_balance WHERE account_uid = ?').run(accountUid);
        
        // 2. Borrar de la tabla principal evaluando tanto uid como id
      //  const info = db.prepare('DELETE FROM account WHERE uid = ? OR id = ?').run(accountUid, accountUid);
     const info = db.prepare('DELETE FROM account WHERE uid = ?').run(accountUid);
        return info.changes;
      });

      const changes = deleteTransaction();

      if (changes === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Tarjeta o cuenta no encontrada en la base de datos.' }));
        return true;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  return false;
}