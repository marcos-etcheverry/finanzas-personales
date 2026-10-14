import http from 'http';
import { db } from '../db';

export async function handleCreditCardsRoutes(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): Promise<boolean> {
  
  // 1. GET /api/credit-cards - Listar tarjetas
  if (req.method === 'GET' && pathname === '/api/credit-cards') {
    try {
      const cards = db.prepare("SELECT * FROM account WHERE type = 'credit_card' ORDER BY title DESC").all();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(cards));
      return true;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
  }

  // 2. POST /api/credit-cards - Crear una nueva tarjeta de crédito (Tabla unificada: account)
  if (req.method === 'POST' && pathname === '/api/credit-cards') {
    try {
      let body = '';
      for await (const chunk of req) body += chunk;
      const { title, closing_day, due_day, image_path } = JSON.parse(body);

      if (!title) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'El título de la tarjeta es obligatorio' }));
        return true;
      }

      const stmt = db.prepare(`
        INSERT INTO account (title, type, balance, currency, closing_day, due_day, image_path)
        VALUES (?, 'credit_card', 0, 'ARS', ?, ?, ?)
      `);
      const result = stmt.run(title, closing_day || null, due_day || null, image_path || null);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, id: result.lastInsertRowid }));
      return true;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
  }

  // 3. POST /api/credit-cards/purchase - Registrar compra en cuotas
  if (req.method === 'POST' && pathname === '/api/credit-cards/purchase') {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const data = JSON.parse(body);
      const { account_uid, total_amount, installments, purchase_date, comment } = data;

      if (!account_uid || !total_amount || !installments || !purchase_date) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Faltan datos obligatorios (account_uid, total_amount, installments, purchase_date)' }));
        return true;
      }

      const installmentAmount = total_amount / installments;
      const transactionId = 'tx_cc_' + Date.now();
      
      const insertMany = db.transaction((rows: any[]) => {
        const stmt = db.prepare(`
          INSERT INTO credit_card_installments 
          (transaction_id, installment_number, total_installments, amount, due_date, status)
          VALUES (?, ?, ?, ?, ?, 'pending')
        `);
        for (const row of rows) {
          stmt.run(row.txId, row.instNum, row.totalInst, row.amount, row.dueDate);
        }
      });

      const rowsToInsert = [];
      let baseDate = new Date(purchase_date);

      for (let i = 1; i <= installments; i++) {
        baseDate.setMonth(baseDate.getMonth() + 1);
        const dueDateStr = baseDate.toISOString().split('T')[0];

        rowsToInsert.push({
          txId: transactionId,
          instNum: i,
          totalInst: installments,
          amount: installmentAmount,
          dueDate: dueDateStr
        });
      }

      insertMany(rowsToInsert);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        transaction_id: transactionId, 
        installments_created: installments,
        amount_per_installment: installmentAmount 
      }));
      return true;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
  }

  // 4. GET /api/credit-cards/projections - Consultar resumen proyectado por mes
  if (req.method === 'GET' && pathname === '/api/credit-cards/projections') {
    try {
      const rows = db.prepare(`
        SELECT 
          strftime('%Y-%m', due_date) as month,
          SUM(amount) as total_due,
          COUNT(id) as pending_installments
        FROM credit_card_installments
        WHERE status = 'pending'
        GROUP BY month
        ORDER BY month ASC
      `).all();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
      return true;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
  }

  return false;
}