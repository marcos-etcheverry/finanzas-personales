import http from 'http';
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

export async function handleTransfersRoutes(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<boolean> {
  if (!pathname.startsWith('/api/transfers')) {
    return false;
  }

  // --- GET /api/transfers (Listar transferencias recientes) ---
  if (req.method === 'GET') {
    try {
      const transfers = db.prepare(`
        SELECT 
          tr.*, 
          a1.title as from_account_title, 
          a2.title as to_account_title
        FROM transfer tr
        JOIN account a1 ON tr.fromAccountUid = a1.uid
        JOIN account a2 ON tr.toAccountUid = a2.uid
        WHERE tr.isRemoved = 0
        ORDER BY tr.date DESC
        LIMIT 50
      `).all();

      console.log(`[GET] /api/transfers -> Se devolvieron ${transfers.length} transferencias.`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(transfers));
    } catch (err: any) {
      console.error('[ERROR GET /api/transfers]:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- POST /api/transfers (Crear transferencia y actualizar saldos de ambas cuentas atómicamente) ---
  if (req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      console.log('[POST] /api/transfers -> Body:', body);

      const { fromAccountUid, toAccountUid, fromAmount, toAmount, comment, date } = body;

      if (!fromAccountUid || !toAccountUid || !fromAmount) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'fromAccountUid, toAccountUid y fromAmount son requeridos.' }));
        return true;
      }

      if (fromAccountUid === toAccountUid) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Las cuentas de origen y destino no pueden ser la misma.' }));
        return true;
      }

      const accFrom = db.prepare('SELECT currencyCode FROM account WHERE uid = ?').get(fromAccountUid) as any;
      const accTo = db.prepare('SELECT currencyCode FROM account WHERE uid = ?').get(toAccountUid) as any;

      if (!accFrom || !accTo) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Una o ambas cuentas no existen.' }));
        return true;
      }

      const trUid = 'tr_' + Date.now();
      const now = new Date().toISOString();
      const trDate = date || now;
      const finalToAmount = toAmount !== undefined ? toAmount : fromAmount;

      const executeTransfer = db.transaction(() => {
        db.prepare(`
          UPDATE account_balance 
          SET value = value - ?, updated_at = ? 
          WHERE account_uid = ?
        `).run(fromAmount, now, fromAccountUid);

        db.prepare(`
          UPDATE account_balance 
          SET value = value + ?, updated_at = ? 
          WHERE account_uid = ?
        `).run(finalToAmount, now, toAccountUid);

        db.prepare(`
          INSERT INTO transfer 
            (uid, created, modified, fromAccountUid, toAccountUid, fromAmount, fromCurrencyCode, toAmount, toCurrencyCode, date, comment)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(trUid, now, now, fromAccountUid, toAccountUid, fromAmount, accFrom.currencyCode, finalToAmount, accTo.currencyCode, trDate, comment || null);

        return { uid: trUid, fromAccountUid, toAccountUid, fromAmount, toAmount: finalToAmount, date: trDate };
      });

      const newTransfer = executeTransfer();
      console.log('[POST] /api/transfers -> Transferencia creada:', newTransfer.uid);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newTransfer));
    } catch (err: any) {
      console.error('[ERROR POST /api/transfers]:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  return false;
}