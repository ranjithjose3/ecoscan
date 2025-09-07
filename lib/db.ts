// lib/db.ts
import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';

export const DB_NAME = 'ecoscan.db';
const DATABASE_VERSION = 1;

let _db: SQLite.SQLiteDatabase | null = null;
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  return _db;
}

/* ------------------------------ schema ----------------------------------- */
async function createFreshSchema(db: SQLite.SQLiteDatabase) {
  // settings
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

  // addresses
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      name TEXT,
      area_name TEXT,
      parcel_id INTEGER,
      place_id TEXT,
      service_id INTEGER,
      area_id INTEGER,
      type TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
  await db.execAsync(`CREATE UNIQUE INDEX IF NOT EXISTS ux_addresses_place_id ON addresses(place_id);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_addresses_title ON addresses(title);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_addresses_area_name ON addresses(area_name);`);
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS trg_addresses_updated
    AFTER UPDATE ON addresses
    FOR EACH ROW BEGIN
      UPDATE addresses
      SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = NEW.id;
    END;
  `);

  // events
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY,          -- API event id (unique)
      place_id TEXT NOT NULL,
      day TEXT NOT NULL,               -- YYYY-MM-DD
      zone_id INTEGER,
      custom_message TEXT,
      custom_subject TEXT,
      is_week_long INTEGER,            -- 0/1
      event_type TEXT,
      short_text_message TEXT,
      name TEXT,
      plain_text_message TEXT,
      area_name TEXT,
      service_name TEXT,
      subject TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
  `);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_events_place_day ON events(place_id, day);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_events_zone ON events(zone_id);`);
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS trg_events_updated
    AFTER UPDATE ON events
    FOR EACH ROW BEGIN
      UPDATE events
      SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = NEW.id;
    END;
  `);

  // reminders — CLEAN: no remind_date; use event_date ONLY + snapshots
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      place_id TEXT NOT NULL,

      event_date TEXT NOT NULL,         -- YYYY-MM-DD
      note TEXT,

      place_title TEXT,
      event_title TEXT,
      service_name TEXT,
      event_type TEXT,

      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
    );
  `);
  await db.execAsync(`CREATE UNIQUE INDEX IF NOT EXISTS ux_reminders_event_place ON reminders(event_id, place_id);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_reminders_event ON reminders(event_id);`);
  await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_reminders_place_eventdate ON reminders(place_id, event_date);`);
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS trg_reminders_updated
    AFTER UPDATE ON reminders
    FOR EACH ROW BEGIN
      UPDATE reminders
      SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
      WHERE id = NEW.id;
    END;
  `);
}

/* ------------------------------ migrate/reset ---------------------------- */
export async function migrate(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`PRAGMA journal_mode = WAL`);
  await db.execAsync(`PRAGMA foreign_keys = ON`);

  const { user_version: currentVer = 0 } =
    (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')) ?? { user_version: 0 };

  if (currentVer >= DATABASE_VERSION) return;

  await db.withExclusiveTransactionAsync(async () => {
    if (currentVer === 0) {
      await createFreshSchema(db);
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    } else {
      await dropAllObjects(db);
      await createFreshSchema(db);
      await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
    }
  });
}

/** Danger: wipes DB and recreates schema. Call once in dev if needed. */
export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.withExclusiveTransactionAsync(async () => {
    await dropAllObjects(db);
    await createFreshSchema(db);
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}

async function dropAllObjects(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`PRAGMA foreign_keys = OFF`);
  await db.execAsync(`DROP TABLE IF EXISTS reminders;`);
  await db.execAsync(`DROP TABLE IF EXISTS events;`);
  await db.execAsync(`DROP TABLE IF EXISTS addresses;`);
  await db.execAsync(`DROP TABLE IF EXISTS settings;`);
  await db.execAsync(`PRAGMA user_version = 0`);
  await db.execAsync(`PRAGMA foreign_keys = ON`);
}

/* ------------------------------ helpers ---------------------------------- */
export async function run(sql: string, ...params: any[]) {
  const db = await getDb();
  if (params.length === 1 && Array.isArray(params[0])) return db.runAsync(sql, params[0]);
  // @ts-expect-error expo-sqlite supports variadic or object bindings
  return db.runAsync(sql, ...params);
}

export async function getFirst<T = any>(sql: string, ...params: any[]) {
  const db = await getDb();
  if (params.length === 1 && Array.isArray(params[0])) return db.getFirstAsync<T>(sql, params[0]);
  // @ts-expect-error variadic/named supported
  return db.getFirstAsync<T>(sql, ...params);
}

export async function getAll<T = any>(sql: string, ...params: any[]) {
  const db = await getDb();
  if (params.length === 1 && Array.isArray(params[0])) return db.getAllAsync<T>(sql, params[0]);
  // @ts-expect-error variadic/named supported
  return db.getAllAsync<T>(sql, ...params);
}

export async function prepare(sql: string) {
  const db = await getDb();
  return db.prepareAsync(sql);
}

export async function withTransaction<T>(fn: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
  const db = await getDb();
  let result!: T;
  await db.withExclusiveTransactionAsync(async () => {
    result = await fn(db);
  });
  return result;
}

/* Optional: set EXPO_PUBLIC_RESET_DB=1 or expo.extra.RESET_DB=1 to wipe on boot */
export async function maybeResetDbOnBoot() {
  const reset =
    String(Constants.expoConfig?.extra?.RESET_DB ?? process.env.EXPO_PUBLIC_RESET_DB ?? '') === '1';
  if (reset) {
    console.log('[DB] RESET_DB=1 → wiping and recreating schema…');
    await resetDatabase();
  }
}
