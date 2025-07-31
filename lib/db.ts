// lib/db.ts
import * as SQLite from 'expo-sqlite';

/** Name kept in one place in case you ever change it */
export const DB_NAME = 'ecoscan.db';

/**
 * Memoized database instance (no top-level await).
 */
let _db: SQLite.SQLiteDatabase | null = null;

/** Exported so other modules (debug tools, etc.) can access the raw DB if needed */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  return _db;
}

/* -------------------------------------------------------------------------- */
/*                               MIGRATION LOGIC                               */
/* -------------------------------------------------------------------------- */

const DATABASE_VERSION = 2;

/**
 * Run database migrations and recommended PRAGMAs.
 * Call this once on app start (e.g., in _layout.tsx).
 */
export async function migrate(): Promise<void> {
  const db = await getDb();

  // Recommended PRAGMAs
  await db.execAsync(`PRAGMA journal_mode = WAL`);
  await db.execAsync(`PRAGMA foreign_keys = ON`);

  // Determine current schema version
  const { user_version: currentVer = 0 } =
    (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')) ||
    { user_version: 0 };

  if (currentVer >= DATABASE_VERSION) return;

  await db.withExclusiveTransactionAsync(async () => {
    let v = currentVer;

    if (v === 0) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          key   TEXT PRIMARY KEY NOT NULL,
          value TEXT
        );
      `);
      v = 1;
    }

    if (v === 1) {
      // v1 -> v2: addresses table for LocationItem mapping
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS addresses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,          -- optional display label
          name TEXT,           -- from LocationItem.name
          area_name TEXT,      -- from LocationItem.area_name
          parcel_id INTEGER,   -- from LocationItem.parcel_id
          place_id TEXT,       -- from LocationItem.place_id (unique-ish)
          service_id INTEGER,  -- from LocationItem.service_id
          area_id INTEGER,     -- from LocationItem.area_id
          type TEXT,           -- from LocationItem.type
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
          updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
        );
      `);

      // Unique & helpful indexes
      await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS ux_addresses_place_id ON addresses(place_id);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_addresses_title ON addresses(title);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_addresses_area_name ON addresses(area_name);
      `);

      // Auto-update the updated_at column on UPDATE
      await db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS trg_addresses_updated
        AFTER UPDATE ON addresses
        FOR EACH ROW BEGIN
          UPDATE addresses
          SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE id = NEW.id;
        END;
      `);

      v = 2;
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}

/* -------------------------------------------------------------------------- */
/*                            CONVENIENCE HELPERS                              */
/* -------------------------------------------------------------------------- */

export async function run(
  sql: string,
  ...params: any[]
): Promise<SQLite.RunResult> {
  const db = await getDb();
  if (params.length === 1 && Array.isArray(params[0])) {
    return db.runAsync(sql, params[0]);
  }
  // @ts-expect-error expo-sqlite supports variadic or object bindings
  return db.runAsync(sql, ...params);
}

export async function getFirst<T = any>(
  sql: string,
  ...params: any[]
): Promise<T | undefined> {
  const db = await getDb();
  if (params.length === 1 && Array.isArray(params[0])) {
    return db.getFirstAsync<T>(sql, params[0]);
  }
  // @ts-expect-error variadic/named supported
  return db.getFirstAsync<T>(sql, ...params);
}

export async function getAll<T = any>(
  sql: string,
  ...params: any[]
): Promise<T[]> {
  const db = await getDb();
  if (params.length === 1 && Array.isArray(params[0])) {
    return db.getAllAsync<T>(sql, params[0]);
  }
  // @ts-expect-error variadic/named supported
  return db.getAllAsync<T>(sql, ...params);
}

export async function prepare(sql: string) {
  const db = await getDb();
  return db.prepareAsync(sql);
}

export async function withTransaction<T>(
  fn: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const db = await getDb();
  return db.withExclusiveTransactionAsync(async () => fn(db));
}
