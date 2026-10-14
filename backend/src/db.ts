import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../finanzas.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  // 1. Tabla de Cuentas (Soporta cuentas normales y tarjetas de crédito)
  db.exec(`
      CREATE TABLE IF NOT EXISTS account (
        uid TEXT PRIMARY KEY,
        created TEXT,
        modified TEXT,
        title TEXT,
        type TEXT DEFAULT 'cash',       -- 'cash', 'bank', 'credit_card'
        closing_day INTEGER,            -- Día de cierre para tarjetas de crédito
        due_day INTEGER,                -- Día de vencimiento para tarjetas de crédito
        image_path TEXT,                -- Imagen o logo asociado
        icon TEXT,                      -- Identificador de ícono moderno
        color TEXT,                     -- Código hexadecimal
        currencyCode TEXT,
        include_in_balance INTEGER DEFAULT 1,
        isRemoved INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1
      );
  `);

  // Migración defensiva por si la tabla 'account' ya existía sin estas columnas
  const accountColumns = [
    "ALTER TABLE account ADD COLUMN type TEXT DEFAULT 'cash';",
    "ALTER TABLE account ADD COLUMN closing_day INTEGER;",
    "ALTER TABLE account ADD COLUMN due_day INTEGER;",
    "ALTER TABLE account ADD COLUMN image_path TEXT;",
    "ALTER TABLE account ADD COLUMN icon TEXT;",
    "ALTER TABLE account ADD COLUMN color TEXT;",
    "ALTER TABLE account ADD COLUMN include_in_balance INTEGER DEFAULT 1;",
    "ALTER TABLE account ADD COLUMN position INTEGER DEFAULT 0;"
  ];

  for (const sql of accountColumns) {
    try { db.exec(sql); } catch (e) {}
  }

  // 2. Tabla de Saldos
  db.exec(`
    CREATE TABLE IF NOT EXISTS account_balance (
      uid TEXT PRIMARY KEY,
      account_uid TEXT NOT NULL,
      value REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (account_uid) REFERENCES account(uid)
    );
  `);

  // 3. Tabla de Categorías
  db.exec(`
    CREATE TABLE IF NOT EXISTS category (
      uid TEXT PRIMARY KEY,
      created TEXT NOT NULL,
      modified TEXT NOT NULL,
      isRemoved INTEGER DEFAULT 0,
      title TEXT NOT NULL,
      parent_uid TEXT,
      icon TEXT,
      color TEXT,
      FOREIGN KEY (parent_uid) REFERENCES category(uid)
    );
  `);

  try { db.exec(`ALTER TABLE category ADD COLUMN parent_uid TEXT;`); } catch (err) {}

  // 4. Tabla de Cuotas de Tarjetas de Crédito
  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_card_installments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT,
      installment_number INTEGER NOT NULL,
      total_installments INTEGER NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Tabla de Transacciones
  db.exec(`
    CREATE TABLE IF NOT EXISTS \`transaction\` (
      uid TEXT PRIMARY KEY,
      created TEXT NOT NULL,
      modified TEXT NOT NULL,
      isRemoved INTEGER DEFAULT 0,
      type TEXT NOT NULL,
      account_uid TEXT NOT NULL,
      category_uid TEXT,
      tag TEXT,
      amountInAccountCurrency REAL NOT NULL,
      accountCurrencyCode TEXT NOT NULL,
      date TEXT NOT NULL,
      comment TEXT,
      FOREIGN KEY (account_uid) REFERENCES account(uid),
      FOREIGN KEY (category_uid) REFERENCES category(uid)
    );
  `);

  try { db.exec(`ALTER TABLE \`transaction\` ADD COLUMN category_uid TEXT;`); } catch (e) {}
  try { db.exec(`ALTER TABLE \`transaction\` ADD COLUMN tag TEXT;`); } catch (e) {}

  // 6. Tabla de Transferencias
  db.exec(`
    CREATE TABLE IF NOT EXISTS transfer (
      uid TEXT PRIMARY KEY,
      created TEXT NOT NULL,
      modified TEXT NOT NULL,
      isRemoved INTEGER DEFAULT 0,
      fromAccountUid TEXT NOT NULL,
      toAccountUid TEXT NOT NULL,
      fromAmount REAL NOT NULL,
      fromCurrencyCode TEXT NOT NULL,
      toAmount REAL NOT NULL,
      toCurrencyCode TEXT NOT NULL,
      date TEXT NOT NULL,
      comment TEXT,
      FOREIGN KEY (fromAccountUid) REFERENCES account(uid),
      FOREIGN KEY (toAccountUid) REFERENCES account(uid)
    );
  `);

  // 7. Tabla de Configuración
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Sembrado inicial de categorías si está vacía
  const count = (db.prepare('SELECT COUNT(*) as cnt FROM category').get() as any).cnt;
  if (count === 0) {
    console.log('[SEED] Poblando categorías iniciales...');
    const now = new Date().toISOString();
    const insertCat = db.prepare(`
      INSERT INTO category (uid, created, modified, title, parent_uid)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertCat.run('cat_comida', now, now, 'Comida', null);
    insertCat.run('cat_servicios', now, now, 'Servicios', null);
    insertCat.run('cat_transporte', now, now, 'Transporte', null);

    insertCat.run('cat_supermercado', now, now, 'Supermercado', 'cat_comida');
    insertCat.run('cat_restaurante', now, now, 'Restaurante', 'cat_comida');
    console.log('[SEED] Categorías base listas.');
  }
}

initDb();