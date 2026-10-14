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

export async function handleTransactionsRoutes(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<boolean> {
  if (!pathname.startsWith('/api/transactions')) {
    return false;
  }

  // --- GET /api/transactions ---
  if (req.method === 'GET') {
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

  // --- POST /api/transactions (Soporte para cuentas normales y tarjetas de crédito en cuotas) ---
  if (req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const type = body.type;
      const account_uid = body.account_uid || body.accountUid;
      const category_uid = body.category_uid || body.categoryUid || null;
      const tag = body.tag || null;
      const amount = body.amount !== undefined ? body.amount : body.amountInAccountCurrency;
      const comment = body.comment || body.description || null;
      const date = body.date || new Date().toISOString().split('T')[0];
      const installments = parseInt(body.installments) || 1; // Cantidad de cuotas (por defecto 1)

      if (!type || !account_uid || amount === undefined || amount === null) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'type, account_uid y amount son requeridos.' }));
        return true;
      }

      // Verificamos el tipo de cuenta (si es cash, bank_account o credit_card)
      const account = db.prepare('SELECT type, currencyCode FROM account WHERE uid = ?').get(account_uid) as any;
      if (!account) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'La cuenta especificada no existe.' }));
        return true;
      }

      const txUid = 'tx_' + Date.now();
      const now = new Date().toISOString();

      const executeTx = db.transaction(() => {
        // 1. Insertamos la transacción principal
        db.prepare(`
          INSERT INTO \`transaction\` 
            (uid, created, modified, type, account_uid, category_uid, tag, amountInAccountCurrency, accountCurrencyCode, date, comment)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(txUid, now, now, type, account_uid, category_uid, tag, amount, account.currencyCode, date, comment);

        // 2. Comportamiento según el tipo de cuenta
        if (account.type === 'credit_card') {
          // Si es tarjeta de crédito, generamos las cuotas en credit_card_installments
          const installmentAmount = amount / installments;
          const stmtInstallment = db.prepare(`
            INSERT INTO credit_card_installments 
            (transaction_id, installment_number, total_installments, amount, due_date, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
          `);

          let baseDate = new Date(date);
          for (let i = 1; i <= installments; i++) {
            baseDate.setMonth(baseDate.getMonth() + 1);
            const dueDateStr = baseDate.toISOString().split('T')[0];
            stmtInstallment.run(txUid, i, installments, installmentAmount, dueDateStr);
          }
        } else {
          // Si es cuenta normal (efectivo/banco), impacta en el saldo de inmediato
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

  return false;
}