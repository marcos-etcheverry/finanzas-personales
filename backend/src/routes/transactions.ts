import http from 'http';
import { db } from '../db';
import { logWithDate } from '../utils/logger';

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

export async function handleTransactionsRoutes(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<boolean> {
  if (!pathname.startsWith('/api/transactions')) {
    return false;
  }

  // --- GET /api/transactions ---
  if (req.method === 'GET' && pathname === '/api/transactions') {
    try {
      const transactions = db.prepare(`
        SELECT 
          t.*, 
          a.title as account_title,
          c.title as category_title
        FROM \`transaction\` t
        JOIN account a ON t.account_uid = a.uid
        LEFT JOIN category c ON t.category_uid = c.uid
        WHERE t.isRemoved = 0
        ORDER BY t.date DESC
        LIMIT 50
      `).all();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(transactions));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- POST /api/transactions ---
  if (req.method === 'POST' && pathname === '/api/transactions') {
    try {
  
      const body = await parseJsonBody(req);
      const type = body.type;
      const account_uid = body.account_uid || body.accountUid;
      const category_uid = body.category_uid || body.categoryUid || null;
      const tag = body.tag || null;
      const amount = body.amount !== undefined ? body.amount : body.amountInAccountCurrency;
      const comment = body.comment || body.description || null;
      const date = body.date || new Date().toISOString().split('T')[0];
      const installments = parseInt(body.installments) || 1;

      if (!type || !account_uid || amount === undefined || amount === null) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'type, account_uid y amount son requeridos.' }));
        return true;
      }

      const account = db.prepare('SELECT type, currencyCode FROM account WHERE uid = ?').get(account_uid) as any;
      if (!account) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'La cuenta especificada no existe.' }));
        return true;
      }

      const txUid = 'tx_' + Date.now();
      const now = new Date().toISOString();

      const executeTx = db.transaction(() => {
        
        
        
        logWithDate('/api/transactions', `Transaction - Datos recibidos: ${JSON.stringify(executeTx)}`);
        db.prepare(`
          INSERT INTO \`transaction\` 
            (uid, created, modified, type, account_uid, category_uid, tag, amountInAccountCurrency, accountCurrencyCode, date, comment)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(txUid, now, now, type, account_uid, category_uid, tag, amount, account.currencyCode, date, comment);

        if (account.type === 'credit_card') {
        logWithDate('/api/transactions', 'Transaction - Gasto en la tarjeta de crédito, generando cuotas...');
        
          const installmentAmount = amount / installments;
          const stmtInstallment = db.prepare(`
            INSERT INTO credit_card_installments 
            (transaction_id, installment_number, total_installments, amount, due_date, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
          `);
          logWithDate('/api/transactions', `Transaction - Datos recibidos: ${JSON.stringify(stmtInstallment)}`);
   
          let baseDate = new Date(date);
          for (let i = 1; i <= installments; i++) {
            baseDate.setMonth(baseDate.getMonth())+1; 
            const dueDateStr = baseDate.toISOString().split('T')[0];
            stmtInstallment.run(txUid, i, installments, installmentAmount, dueDateStr);
          }
        } else {
          const delta = type === 'INCOME' ? amount : -amount;
          db.prepare(`
            UPDATE account_balance 
            SET value = value + ?, updated_at = ?
            WHERE account_uid = ?
          `).run(delta, now, account_uid);
        }

        return { uid: txUid, type, account_uid, installments, amount, date };
      });

      const newTx = executeTx();
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newTx));
    } catch (err: any) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  // --- PUT /api/transactions/:uid (Modificar movimiento) ---
  const putMatch = pathname.match(/^\/api\/transactions\/(.+)$/);
  if (req.method === 'PUT' && putMatch) {
    const txUid = putMatch[1];
    try {
      const body = await parseJsonBody(req);
      const oldTx = db.prepare('SELECT * FROM \`transaction\` WHERE uid = ?').get(txUid) as any;
      if (!oldTx) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Movimiento no encontrado.' }));
        return true;
      }

      const newType = body.type || oldTx.type;
      const newAccountUid = body.account_uid || body.accountUid || oldTx.account_uid;
      const newCategoryUid = body.category_uid !== undefined ? body.category_uid : oldTx.category_uid;
      const newTag = body.tag !== undefined ? body.tag : oldTx.tag;
      const newAmount = body.amount !== undefined ? body.amount : oldTx.amountInAccountCurrency;
      const newComment = body.comment !== undefined ? body.comment : oldTx.comment;
      const newDate = body.date || oldTx.date;
      const now = new Date().toISOString();

      const executeUpdate = db.transaction(() => {
        // 1. Revertir impacto anterior en saldo (si era cuenta normal)
        const oldAccount = db.prepare('SELECT type FROM account WHERE uid = ?').get(oldTx.account_uid) as any;
        if (oldAccount && oldAccount.type !== 'credit_card') {
          const oldDelta = oldTx.type === 'INCOME' ? -oldTx.amountInAccountCurrency : oldTx.amountInAccountCurrency;
          db.prepare(`UPDATE account_balance SET value = value + ?, updated_at = ? WHERE account_uid = ?`)
            .run(oldDelta, now, oldTx.account_uid);
        }

        // 2. Aplicar nuevo impacto en saldo
        const newAccount = db.prepare('SELECT type FROM account WHERE uid = ?').get(newAccountUid) as any;
        if (newAccount && newAccount.type !== 'credit_card') {
          const newDelta = newType === 'INCOME' ? newAmount : -newAmount;
          db.prepare(`UPDATE account_balance SET value = value + ?, updated_at = ? WHERE account_uid = ?`)
            .run(newDelta, now, newAccountUid);
        }

        // 3. Actualizar registro
        db.prepare(`
          UPDATE \`transaction\` 
          SET modified = ?, type = ?, account_uid = ?, category_uid = ?, tag = ?, amountInAccountCurrency = ?, date = ?, comment = ?
          WHERE uid = ?
        `).run(now, newType, newAccountUid, newCategoryUid, newTag, newAmount, newDate, newComment, txUid);

        return { uid: txUid, success: true };
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

  // --- DELETE /api/transactions/:uid (Eliminar movimiento) ---
  const deleteMatch = pathname.match(/^\/api\/transactions\/(.+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    const txUid = deleteMatch[1];
    try {
      const tx = db.prepare('SELECT * FROM \`transaction\` WHERE uid = ?').get(txUid) as any;
      if (!tx) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Movimiento no encontrado.' }));
        return true;
      }

      const now = new Date().toISOString();
      const executeDelete = db.transaction(() => {
        // 1. Revertir saldo en cuenta normal
        const account = db.prepare('SELECT type FROM account WHERE uid = ?').get(tx.account_uid) as any;
        if (account && account.type !== 'credit_card') {
          const delta = tx.type === 'INCOME' ? -tx.amountInAccountCurrency : tx.amountInAccountCurrency;
          db.prepare(`UPDATE account_balance SET value = value + ?, updated_at = ? WHERE account_uid = ?`)
            .run(delta, now, tx.account_uid);
        }

        // 2. Marcar como eliminado (soft delete) y limpiar cuotas si era tarjeta
        db.prepare(`UPDATE \`transaction\` SET isRemoved = 1, modified = ? WHERE uid = ?`).run(now, txUid);
        db.prepare(`UPDATE credit_card_installments SET status = 'cancelled' WHERE transaction_id = ?`).run(txUid);

        return { success: true };
      });

      executeDelete();
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