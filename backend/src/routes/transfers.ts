import http from 'http';
import { db } from '../db';

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

  // --- GET /api/transfers ---
  if (req.method === 'GET' && pathname === '/api/transfers') {
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

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(transfers));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- POST /api/transfers ---
  if (req.method === 'POST' && pathname === '/api/transfers') {
    try {
      const body = await parseJsonBody(req);
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

        const targetAccount = db.prepare('SELECT type FROM account WHERE uid = ?').get(toAccountUid) as any;
// Al ser pasivo (tarjeta de crédito), pagar la tarjeta significa sumar al balance para reducir la deuda
        const balanceChange = finalToAmount;

        db.prepare(`
          UPDATE account_balance 
          SET value = value + ?, updated_at = ? 
          WHERE account_uid = ?
        `).run(balanceChange, now, toAccountUid);

        db.prepare(`
          INSERT INTO transfer 
            (uid, created, modified, fromAccountUid, toAccountUid, fromAmount, fromCurrencyCode, toAmount, toCurrencyCode, date, comment)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(trUid, now, now, fromAccountUid, toAccountUid, fromAmount, accFrom.currencyCode, finalToAmount, accTo.currencyCode, trDate, comment || null);

        return { uid: trUid, fromAccountUid, toAccountUid, fromAmount, toAmount: finalToAmount, date: trDate };
      });

      const newTransfer = executeTransfer();
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newTransfer));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- PUT /api/transfers/:uid (Modificar transferencia) ---
  const putMatch = pathname.match(/^\/api\/transfers\/(.+)$/);
  if (req.method === 'PUT' && putMatch) {
    const trUid = putMatch[1];
    try {
      const body = await parseJsonBody(req);
      const oldTr = db.prepare('SELECT * FROM transfer WHERE uid = ?').get(trUid) as any;
      if (!oldTr) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Transferencia no encontrada.' }));
        return true;
      }

      const newFromAcc = body.fromAccountUid || oldTr.fromAccountUid;
      const newToAcc = body.toAccountUid || oldTr.toAccountUid;
      const newFromAmount = body.fromAmount !== undefined ? body.fromAmount : oldTr.fromAmount;
      const newToAmount = body.toAmount !== undefined ? body.toAmount : oldTr.toAmount;
      const newComment = body.comment !== undefined ? body.comment : oldTr.comment;
      const newDate = body.date || oldTr.date;
      const now = new Date().toISOString();

      const executeUpdate = db.transaction(() => {
// 1. Revertir impacto anterior en saldos
        db.prepare(`UPDATE account_balance SET value = value + ?, updated_at = ? WHERE account_uid = ?`)
          .run(oldTr.fromAmount, now, oldTr.fromAccountUid);

// Si el destino viejo era tarjeta de crédito, se revierte restando; si era cuenta común, también.
        const oldTargetAcc = db.prepare('SELECT type FROM account WHERE uid = ?').get(oldTr.toAccountUid) as any;
        const revertOldDest = (oldTargetAcc && oldTargetAcc.type === 'credit_card') ? -oldTr.toAmount : -oldTr.toAmount;
        db.prepare(`UPDATE account_balance SET value = value + ?, updated_at = ? WHERE account_uid = ?`)
          .run(revertOldDest, now, oldTr.toAccountUid);

// 2. Aplicar nuevo impacto en saldos
        db.prepare(`UPDATE account_balance SET value = value - ?, updated_at = ? WHERE account_uid = ?`)
          .run(newFromAmount, now, newFromAcc);

const newTargetAcc = db.prepare('SELECT type FROM account WHERE uid = ?').get(newToAcc) as any;
        const applyNewDest = (newTargetAcc && newTargetAcc.type === 'credit_card') ? newToAmount : newToAmount;
        db.prepare(`UPDATE account_balance SET value = value + ?, updated_at = ? WHERE account_uid = ?`)
          .run(applyNewDest, now, newToAcc);

        // 3. Actualizar registro
        db.prepare(`
          UPDATE transfer 
          SET modified = ?, fromAccountUid = ?, toAccountUid = ?, fromAmount = ?, toAmount = ?, date = ?, comment = ?
          WHERE uid = ?
        `).run(now, newFromAcc, newToAcc, newFromAmount, newToAmount, newDate, newComment, trUid);

        return { uid: trUid, success: true };
      });

      const result = executeUpdate();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- DELETE /api/transfers/:uid (Eliminar transferencia y revertir saldos) ---
  const deleteMatch = pathname.match(/^\/api\/transfers\/(.+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    const trUid = deleteMatch[1];
    try {
      const transfer = db.prepare('SELECT * FROM transfer WHERE uid = ?').get(trUid) as any;
      if (!transfer) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Transferencia no encontrada.' }));
        return true;
      }

      const now = new Date().toISOString();

      const executeDelete = db.transaction(() => {
        // 1. Revertir origen: devolver el dinero que había salido (sumar a account_balance)
        db.prepare(`UPDATE account_balance SET value = value + ?, updated_at = ? WHERE account_uid = ?`)
          .run(transfer.fromAmount, now, transfer.fromAccountUid);

// 2. Revertir destino: quitar el dinero que había entrado según el tipo de cuenta
        const targetAcc = db.prepare('SELECT type FROM account WHERE uid = ?').get(transfer.toAccountUid) as any;
        const revertDest = (targetAcc && targetAcc.type === 'credit_card') ? -transfer.toAmount : -transfer.toAmount;
        
        db.prepare(`UPDATE account_balance SET value = value + ?, updated_at = ? WHERE account_uid = ?`)
          .run(revertDest, now, transfer.toAccountUid);

        // 3. Borrar el registro de transferencia
        db.prepare('DELETE FROM transfer WHERE uid = ?').run(trUid);

        return { success: true };
      });

      const result = executeDelete();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  return false;
}