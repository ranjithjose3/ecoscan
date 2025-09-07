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

/**
 * Bump this when you add/modify tables or indexes.
 * v1: settings
 * v2: addresses (+ indexes/triggers)
 * v3: events (+ indexes/triggers)
 * v4: reminders (+ indexes/triggers)
 */
const DATABASE_VERSION = 4;

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

        /* ------------------------------ v0 -> v1 ------------------------------ */
        if (v === 0) {
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS settings (
                                                        key   TEXT PRIMARY KEY NOT NULL,
                                                        value TEXT
                );
            `);
            v = 1;
        }

        /* ------------------------------ v1 -> v2 ------------------------------ */
        if (v === 1) {
            // addresses table for LocationItem mapping
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS addresses (
                                                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                         title TEXT,          -- optional display label
                                                         name TEXT,           -- from LocationItem.name
                                                         area_name TEXT,      -- from LocationItem.area_name
                                                         parcel_id INTEGER,   -- from LocationItem.parcel_id
                                                         place_id TEXT,       -- from LocationItem.place_id (unique natural key)
                                                         service_id INTEGER,  -- from LocationItem.service_id
                                                         area_id INTEGER,     -- from LocationItem.area_id
                                                         type TEXT,           -- from LocationItem.type
                                                         created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
                    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
                    );
            `);

            // Unique & helpful indexes
            await db.execAsync(`CREATE UNIQUE INDEX IF NOT EXISTS ux_addresses_place_id ON addresses(place_id);`);
            await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_addresses_title ON addresses(title);`);
            await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_addresses_area_name ON addresses(area_name);`);

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

        /* ------------------------------ v2 -> v3 ------------------------------ */
        if (v === 2) {
            // events table: stores Recollect events keyed by API `id` (unique)
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS events (
                                                      id INTEGER PRIMARY KEY,          -- API event id (unique)
                                                      place_id TEXT NOT NULL,          -- selected place id
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

            // Indexes for common queries
            await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_events_place_day ON events(place_id, day);`);
            await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_events_zone ON events(zone_id);`);

            // Auto-update updated_at on UPDATE
            await db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS trg_events_updated
        AFTER UPDATE ON events
        FOR EACH ROW BEGIN
          UPDATE events
          SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE id = NEW.id;
        END;
      `);

            v = 3;
        }

        /* ------------------------------ v3 -> v4 ------------------------------ */
        if (v === 3) {
            // reminders table: stores user reminders for events
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

            // Indexes for reminders
            await db.execAsync(`CREATE UNIQUE INDEX IF NOT EXISTS ux_reminders_event_place ON reminders(event_id, place_id);`);
            await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_reminders_event ON reminders(event_id);`);
            await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_reminders_place_eventdate ON reminders(place_id, event_date);`);

            // Auto-update updated_at on UPDATE
            await db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS trg_reminders_updated
        AFTER UPDATE ON reminders
        FOR EACH ROW BEGIN
          UPDATE reminders
          SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
          WHERE id = NEW.id;
        END;
      `);

            v = 4;
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
): Promise<SQLite.SQLiteRunResult> {
    const db = await getDb();
    if (params.length === 1 && Array.isArray(params[0])) {
        return db.runAsync(sql, params[0]);
    }
    return db.runAsync(sql, ...params);
}

export async function getFirst<T = any>(
    sql: string,
    ...params: any[]
): Promise<T | null> {
    const db = await getDb();
    if (params.length === 1 && Array.isArray(params[0])) {
        return db.getFirstAsync<T>(sql, params[0]);
    }
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

    let result!: T; // will be assigned inside the transaction
    await db.withExclusiveTransactionAsync(async () => {
        result = await fn(db);
    });

    return result;
}