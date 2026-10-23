import http from 'http';
import { db } from '../db';
import { logWithDate } from '../utils/logger';

// Helper para parsear el cuerpo JSON de las peticiones
// Helper robusto para parsear el cuerpo JSON de las peticiones
function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        logWithDate('DEBUG_BODY', `Texto crudo recibido del cliente: [${body}]`);
        if (!body) {
          resolve({});
          return;
        }
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err: any) {
        logWithDate('ERROR_BODY', `Fallo al parsear JSON: ${err.message} | Body era: ${body}`);
        reject(err);
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

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
 
  // 2. POST /api/credit-cards - Crear una nueva tarjeta de crédito
  if (req.method === 'POST' && pathname === '/api/credit-cards') {
    try {
      const body = await parseJsonBody(req);
      const { title, closing_day, due_day, image_path } = body;

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

// 3. POST /api/credit-cards/purchase - Registrar compra en cuotas con fecha local estricta

if (req.method === 'POST' && pathname === '/api/credit-cards/purchase') {
 
  logWithDate('CREDIT_CARDS', 'Recibida petición POST para registrar compra en cuotas');
    try {

      const data = await parseJsonBody(req);
      const { account_uid, total_amount, installments, purchase_date, comment, category_uid, tag } = data;

      if (!account_uid || !total_amount || !installments || !purchase_date) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Faltan datos obligatorios' }));
        return true;
      }

      // 1. Obtener días de cierre y vencimiento configurados en la tarjeta
      const card = db.prepare("SELECT closing_day, due_day FROM account WHERE uid = ?").get(account_uid) as any;
      const closingDay = card && card.closing_day ? card.closing_day : 1;
      const dueDay = card && card.due_day ? card.due_day : 10;

      // 2. Analizar fecha de compra en formato YYYY-MM-DD
      const [pYear, pMonth, pDay] = purchase_date.split('-').map(Number);
      const purchaseYear = pYear;
      const purchaseMonthIndex = pMonth - 1;
      const purchaseDay = pDay;

      // 3. Regla de cierre estricta
      const mesesAumento = purchaseDay > closingDay ? 2 : 1;

      let baseMonthIndex = purchaseMonthIndex + mesesAumento;
      let baseYear = purchaseYear;

      while (baseMonthIndex > 11) {
        baseMonthIndex -= 12;
        baseYear += 1;
      }

const installmentAmount = total_amount / installments;
      const transactionId = 'tx_cc_' + Date.now();
      const nowIso = new Date().toISOString();
      const currencyCode = card && (card.currencyCode || card.currency) ? (card.currencyCode || card.currency) : 'ARS';

      // 4 y 5. Registrar la transacción, descontar del balance de la tarjeta y generar cuotas de forma atómica
      const executePurchase = db.transaction(() => {
        // A. Registrar la transacción principal
        const txStmt = db.prepare(`
          INSERT INTO "transaction" 
          (uid, created, modified, type, account_uid, category_uid, tag, amountInAccountCurrency, accountCurrencyCode, date, comment)
          VALUES (?, ?, ?, 'EXPENSE', ?, ?, ?, ?, ?, ?, ?)
        `);
        txStmt.run(
          transactionId, 
          nowIso, 
          nowIso, 
          account_uid, 
          category_uid || null,
          tag || null,
          total_amount, 
          currencyCode, 
          purchase_date, 
          comment || 'Compra en cuotas'
        );
        
        // B. Restar el monto total de la compra al balance de la tarjeta (aumenta el pasivo/deuda)
        db.prepare(`
          UPDATE account_balance 
          SET value = value - ?, updated_at = ? 
          WHERE account_uid = ?
        `).run(total_amount, nowIso, account_uid);

        // C. Generar las cuotas
        const stmt = db.prepare(`
          INSERT INTO credit_card_installments 
          (transaction_id, installment_number, total_installments, amount, due_date, status)
          VALUES (?, ?, ?, ?, ?, 'pending')
        `);

        for (let i = 1; i <= installments; i++) {
          let targetMonthIndex = baseMonthIndex + (i - 1);
          let targetYear = baseYear;

          while (targetMonthIndex > 11) {
            targetMonthIndex -= 12;
            targetYear += 1;
          }

          const monthFormatted = String(targetMonthIndex + 1).padStart(2, '0');
          const dayFormatted = String(dueDay).padStart(2, '0');
          const dueDateStr = `${targetYear}-${monthFormatted}-${dayFormatted}`;

          stmt.run(
            transactionId,
            i,
            installments,
            installmentAmount,
            dueDateStr
          );
        }
      });

      // Ejecutar todas las operaciones en la base de datos de forma segura
      executePurchase();

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        transaction_id: transactionId, 
        installments_created: installments,
        amount_per_installment: installmentAmount 
      }));
      logWithDate('CREDIT_CARDS', `Compra guardada con éxito en tarjeta ${account_uid}. Monto total restado al balance: ${total_amount}`);
      return true;
    } catch (err: any) {
      logWithDate('ERROR', `Error en POST /purchase: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
  }
  
 // 4. GET /api/credit-cards/projections - Consultar resumen proyectado
if (req.method === 'GET' && pathname === '/api/credit-cards/projections') {
    try {

      const rows = db.prepare(`
        SELECT 
          card_uid,
          card_title,
          month,
          COALESCE(SUM(total_expense), 0) as total_expense,
          COALESCE(SUM(total_income), 0) as total_income,
          (COALESCE(SUM(total_expense), 0) - COALESCE(SUM(total_income), 0)) as net_total
        FROM (
          -- 1. GASTOS EN CUOTAS PENDIENTES
          SELECT 
            COALESCE(t.account_uid, 'unknown') as card_uid,
            COALESCE(a.title, 'Tarjeta') as card_title,
            strftime('%Y-%m', ici.due_date) as month,
            SUM(ici.amount) as total_expense,
            0 as total_income
          FROM credit_card_installments ici
          JOIN "transaction" t ON ici.transaction_id = t.uid
          JOIN account a ON t.account_uid = a.uid
          WHERE ici.status = 'pending' AND t.type = 'EXPENSE'
          GROUP BY card_uid, month

          UNION ALL

          -- 2. INGRESOS / DEVOLUCIONES (Solo se muestran si el período aún tiene cuotas 'pending')
          SELECT 
            COALESCE(t.account_uid, 'unknown') as card_uid,
            COALESCE(a.title, 'Tarjeta') as card_title,
            CASE 
              WHEN CAST(strftime('%d', t.date) AS INTEGER) > COALESCE(a.closing_day, 1) THEN
                strftime('%Y-%m', date(t.date, '+2 month', 'start of month'))
              ELSE
                strftime('%Y-%m', date(t.date, '+1 month', 'start of month'))
            END as month,
            0 as total_expense,
            SUM(t.amountInAccountCurrency) as total_income
          FROM "transaction" t
          JOIN account a ON t.account_uid = a.uid
          WHERE t.type = 'INCOME' AND a.type = 'credit_card'
            AND EXISTS (
              SELECT 1 
              FROM credit_card_installments ici_check
              JOIN "transaction" t_check ON ici_check.transaction_id = t_check.uid
              WHERE t_check.account_uid = t.account_uid 
                AND strftime('%Y-%m', ici_check.due_date) = (
                  CASE 
                    WHEN CAST(strftime('%d', t.date) AS INTEGER) > COALESCE(a.closing_day, 1) THEN
                      strftime('%Y-%m', date(t.date, '+2 month', 'start of month'))
                    ELSE
                      strftime('%Y-%m', date(t.date, '+1 month', 'start of month'))
                  END
                )
                AND ici_check.status = 'pending'
            )
          GROUP BY card_uid, month
        ) combined
        GROUP BY card_uid, card_title, month
        ORDER BY month ASC, card_title ASC
      `).all();

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rows));
      return true;
    } catch (err: any) {
      console.error('[ERROR GET /api/credit-cards/projections]:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
}

// 4.1. GET /api/credit-cards/details - Obtener detalle unificado (Cuotas + Devoluciones / Ingresos del mes)

  if (req.method === 'GET' && pathname.startsWith('/api/credit-cards/details')) {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const cardUid = url.searchParams.get('card_uid');
      const month = url.searchParams.get('month');
      const status = url.searchParams.get('status');

      if (!cardUid || !month) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Faltan parámetros obligatorios: card_uid y month' }));
        return true;
      }

      // 1. Obtenemos las cuotas de gastos de la tarjeta para ese mes
      let queryInstallments = `
        SELECT 
          ici.id,
          ici.installment_number,
          ici.total_installments,
          ici.amount,
          ici.due_date,
          ici.status,
          t.date as purchase_date,
          t.comment as description,
          t.tag as tag_title,
          c.title as subcategory_title,
          pc.title as parent_category_title,
          'EXPENSE' as item_type
        FROM credit_card_installments ici
        JOIN "transaction" t ON ici.transaction_id = t.uid
        LEFT JOIN category c ON t.category_uid = c.uid
        LEFT JOIN category pc ON c.parent_uid = pc.uid
        WHERE t.account_uid = ? AND strftime('%Y-%m', ici.due_date) = ? AND t.type = 'EXPENSE'
      `;

      const params: any[] = [cardUid, month];

      if (status) {
        queryInstallments += ` AND ici.status = ?`;
        params.push(status);
      }

      const installments = db.prepare(queryInstallments).all(...params);

      // 2. Obtenemos también las transacciones directas (Ingresos / Devoluciones / Ajustes) a la tarjeta usando la regla de cierre
      let queryIncomes = `
        SELECT 
          t.uid as id,
          1 as installment_number,
          1 as total_installments,
          t.amountInAccountCurrency as amount,
          t.date as due_date,
          'pending' as status,
          t.date as purchase_date,
          t.comment as description,
          t.tag as tag_title,
          c.title as subcategory_title,
          pc.title as parent_category_title,
          'INCOME' as item_type
        FROM "transaction" t
        JOIN account a ON t.account_uid = a.uid
        LEFT JOIN category c ON t.category_uid = c.uid
        LEFT JOIN category pc ON c.parent_uid = pc.uid
        WHERE t.account_uid = ? 
          AND (
            CASE 
              WHEN CAST(strftime('%d', t.date) AS INTEGER) > COALESCE(a.closing_day, 1) THEN
                strftime('%Y-%m', date(t.date, '+2 month', 'start of month'))
              ELSE
                strftime('%Y-%m', date(t.date, '+1 month', 'start of month'))
            END
          ) = ? 
          AND t.type = 'INCOME'
      `;

      const incomes = db.prepare(queryIncomes).all(cardUid, month);

      // 3. Unificamos ambos listados para que la grilla web los muestre juntos
      const combinedDetails = [...installments, ...incomes].sort((a: any, b: any) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime());

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(combinedDetails));
      return true;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
  }

// 4.2. GET /api/credit-cards/history - Consultar resúmenes históricos / pagados por tarjeta

if (req.method === 'GET' && pathname === '/api/credit-cards/history') {
    try {
      const rows = db.prepare(`
        SELECT 
          COALESCE(t.account_uid, 'unknown') as card_uid,
          COALESCE(a.title, 'Tarjeta') as card_title,
          strftime('%Y-%m', ici.due_date) as month,
          SUM(ici.amount) as total_paid,
          COUNT(ici.id) as paid_installments
        FROM credit_card_installments ici
        JOIN "transaction" t ON ici.transaction_id = t.uid
        JOIN account a ON t.account_uid = a.uid
        WHERE ici.status = 'paid' AND t.type = 'EXPENSE'
        GROUP BY card_uid, month
        ORDER BY month DESC, card_title ASC
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

// 5. POST /api/credit-cards/settle - Marcar cuotas de un periodo y tarjeta como pagadas

if (req.method === 'POST' && pathname === '/api/credit-cards/settle') {
    try {
      const body = await parseJsonBody(req);
      const { month, card_uid } = body;

      if (!month || !card_uid) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Los parámetros month y card_uid son requeridos.' }));
        return true;
      }

      // Marcar todas las cuotas pendientes del período como pagadas en credit_card_installments
      const stmt = db.prepare(`
        UPDATE credit_card_installments 
        SET status = 'paid' 
        WHERE id IN (
          SELECT ici.id 
          FROM credit_card_installments ici
          JOIN "transaction" t ON ici.transaction_id = t.uid
          WHERE t.account_uid = ? 
            AND strftime('%Y-%m', ici.due_date) = ? 
            AND ici.status = 'pending'
        )
      `);
      
      const result = stmt.run(card_uid, month);

      logWithDate('CREDIT_CARDS', `Resumen ${month} liquidado con éxito para la tarjeta ${card_uid}. Cuotas pagadas: ${result.changes}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, updatedCount: result.changes }));
      return true;
    } catch (err: any) {
      logWithDate('ERROR', `Error en POST /settle: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return true;
    }
}

  return false;
}