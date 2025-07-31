// lib/settingsRepo.ts
import { getFirst, run } from './db';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'themeMode';

export async function getThemeMode(): Promise<ThemeMode | null> {
  const row = await getFirst<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [THEME_KEY]
  );
  const v = row?.value;
  return v === 'light' || v === 'dark' || v === 'system' ? (v as ThemeMode) : null;
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    THEME_KEY,
    mode,
  ]);
}

/* Selected place_id (string) */
const SELECTED_PLACE_ID_KEY = 'selectedPlaceId';

export async function setSelectedPlaceId(placeId: string | null): Promise<void> {
  await run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
    SELECTED_PLACE_ID_KEY,
    placeId,
  ]);
}

export async function getSelectedPlaceId(): Promise<string | null> {
  const row = await getFirst<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [SELECTED_PLACE_ID_KEY]
  );
  return row?.value ?? null;
}
import { getAll } from './db';

export async function debugDumpSettings(): Promise<void> {
  const rows = await getAll<{ key: string; value: string | null }>(
    'SELECT key, value FROM settings ORDER BY key'
  );
  console.log('SETTINGS DUMP:', rows);
}

export async function debugWriteAndReadBack(placeId: string | null): Promise<void> {
  await setSelectedPlaceId(placeId);
  const row = await getFirst<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [SELECTED_PLACE_ID_KEY]
  );
  console.log('WRITE→READ selectedPlaceId:', { wrote: placeId, readBack: row?.value ?? null });
}

/** Dump a quick view of the addresses table (latest first). */
export async function debugFindDuplicatePlaceIdsdebugDumpAddresses(limit = 50, offset = 0): Promise<void> {
  const rows = await getAll<
    {
      id: number;
      place_id: string | null;
      title: string | null;
      name: string | null;
      area_name: string | null;
      parcel_id: number | null;
      service_id: number | null;
      area_id: number | null;
      type: string | null;
      created_at: string;
      updated_at: string;
    }
  >(
    `SELECT id, place_id, title, name, area_name, parcel_id, service_id, area_id, type, created_at, updated_at
     FROM addresses
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  console.log('ADDRESSES DUMP:', rows);
}

/** Dump one row by place_id (handy to verify the upsert). */
export async function debugDumpAddressByPlaceId(placeId: string): Promise<void> {
  const row = await getFirst<{
    id: number;
    place_id: string | null;
    title: string | null;
    name: string | null;
    area_name: string | null;
    parcel_id: number | null;
    service_id: number | null;
    area_id: number | null;
    type: string | null;
    created_at: string;
    updated_at: string;
  }>(`SELECT * FROM addresses WHERE place_id = ?`, [placeId]);
  console.log('ADDRESS BY place_id:', placeId, row ?? null);
}

/** List duplicate place_ids, if any (should be none with the unique index). */
export async function debugFindDuplicatePlaceIds(): Promise<void> {
  const dups = await getAll<{ place_id: string; c: number }>(
    `SELECT place_id, COUNT(*) AS c
     FROM addresses
     WHERE place_id IS NOT NULL AND place_id <> ''
     GROUP BY place_id
     HAVING c > 1`
  );
  console.log('DUPLICATE place_id(s):', dups);
}

/** Show indexes on the addresses table (to confirm the unique index exists). */
export async function debugListAddressIndexes(): Promise<void> {
  // PRAGMA result shape varies; we pull a few common columns.
  const idx = await getAll<{ seq: number; name: string; unique: number }>(
    `PRAGMA index_list(addresses)`
  );
  console.log('ADDRESS INDEXES:', idx);
}