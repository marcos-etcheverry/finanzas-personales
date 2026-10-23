import http from 'http';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { handleAccountsRoutes } from './routes/accounts';
import { handleCategoriesRoutes } from './routes/categories';
import { handleTransactionsRoutes } from './routes/transactions';
import { handleTransfersRoutes } from './routes/transfers';
import { handleSettingsRoutes } from './routes/settings';
import { handleRatesRoutes } from './routes/rates';
import { handleCreditCardsRoutes } from './routes/creditCards';


const PORT = 3000;

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

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 1. HEALTH
  if (req.method === 'GET' && pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // 2. ACCOUNTS (Delegado a su módulo)
  if (await handleAccountsRoutes(req, res, pathname)) {
    return;
  }

  // 3. CATEGORIES (Delegado a su módulo)
  if (await handleCategoriesRoutes(req, res, pathname)) {
    return;
  }

  // 4. TRANSACTIONS (Delegado a su módulo)
  if (await handleTransactionsRoutes(req, res, pathname)) {
    return;
  }

  // 5. TRANSFERS (Delegado a su módulo)
  if (await handleTransfersRoutes(req, res, pathname)) {
    return;
  }

// En el server (junto a los otros módulos):
if (await handleRatesRoutes(req, res, pathname)) {
  return;
}
// 6. CREDIT CARDS (Punto de entrada único y limpio para todas las rutas de tarjetas)
  if (pathname.startsWith('/api/credit-cards')) {
    if (await handleCreditCardsRoutes(req, res, pathname)) {
      return;
    }
  }
// Dentro del servidor HTTP, antes de las rutas estáticas:
if (await handleSettingsRoutes(req, res, pathname)) {
  return;
}
  // 6. FRONTEND ESTÁTICO (Soporte para raíz y archivos estáticos)
  if (req.method === 'GET') {
    let filePath = '';
    let contentType = 'text/html; charset=utf-8';

    if (pathname === '/' || pathname === '/index.html') {
      filePath = path.join(__dirname, '../../web/index.html');
    } else {
      filePath = path.join(__dirname, '../../web', pathname);
    }

    const ext = path.extname(filePath);
    if (ext === '.css') contentType = 'text/css';
    else if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Recurso no encontrado' }));
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      }
    });
    return;
  }

  // 404 por defecto
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

server.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});