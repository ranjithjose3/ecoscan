// lib/addressRepo.ts
import { getAll, getFirst, run } from './db';

export type Address = {
  id?: number;
  title?: string | null;
  name?: string | null;
  area_name?: string | null;
  parcel_id?: number | null;
  place_id?: string | null;  // unique natural key
  service_id?: number | null;
  area_id?: number | null;
  type?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type NewAddress = Omit<Address, 'id' | 'created_at' | 'updated_at'>;

/** Your UI / picker item shape */
export type LocationItem = {
  area_name: string;
  parcel_id: number;
  place_id: string;
  name: string;
  service_id: number;
  area_id: number;
  type: string;
  id?: string;    // MUST equal place_id for the dropdown
  title?: string; // display label
};

/* ---------- normalization helpers ---------- */
const toText = (v: any) => (typeof v === 'string' && v.trim() ? v : null);
const toInt  = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Map UI object -> DB row while avoiding empty strings and ensuring place_id/name */
export function fromLocationItem(item: LocationItem): NewAddress {
  const placeId = toText(item.place_id) ?? toText(item.id);
  const name    = toText(item.name) ?? toText(item.title);

  return {
    title: toText(item.title) ?? name,
    name,
    area_name: toText(item.area_name),
    parcel_id: toInt(item.parcel_id),
    place_id: placeId,
    service_id: toInt(item.service_id),
    area_id: toInt(item.area_id),
    type: toText(item.type),
  };
}

/** Upsert by unique place_id. On update, only overwrite with non-null values. */
export async function upsertAddress(a: NewAddress): Promise<number> {
  const safe: NewAddress = {
    title: a.title ?? null,
    name: a.name ?? null,
    area_name: a.area_name ?? null,
    parcel_id: a.parcel_id ?? null,
    place_id: a.place_id ?? null,
    service_id: a.service_id ?? null,
    area_id: a.area_id ?? null,
    type: a.type ?? null,
  };

  if (safe.place_id) {
    const existing = await getFirst<{ id: number }>(
      'SELECT id FROM addresses WHERE place_id = ?',
      [safe.place_id]
    );
    if (existing?.id) {
      await run(
        `UPDATE addresses SET
           title      = COALESCE($title,      title),
           name       = COALESCE($name,       name),
           area_name  = COALESCE($area_name,  area_name),
           parcel_id  = COALESCE($parcel_id,  parcel_id),
           service_id = COALESCE($service_id, service_id),
           area_id    = COALESCE($area_id,    area_id),
           type       = COALESCE($type,       type)
         WHERE id = $id`,
        {
          $id: existing.id,
          $title: safe.title,
          $name: safe.name,
          $area_name: safe.area_name,
          $parcel_id: safe.parcel_id,
          $service_id: safe.service_id,
          $area_id: safe.area_id,
          $type: safe.type,
        }
      );
      return existing.id;
    }
  }

  const res = await run(
    `INSERT INTO addresses
       (title, name, area_name, parcel_id, place_id, service_id, area_id, type)
     VALUES ($title, $name, $area_name, $parcel_id, $place_id, $service_id, $area_id, $type)`,
    {
      $title: safe.title,
      $name: safe.name,
      $area_name: safe.area_name,
      $parcel_id: safe.parcel_id,
      $place_id: safe.place_id,
      $service_id: safe.service_id,
      $area_id: safe.area_id,
      $type: safe.type,
    }
  );
  return Number(res.lastInsertRowId);
}

export async function getAddressByPlaceId(place_id: string) {
  return getFirst<Address>('SELECT * FROM addresses WHERE place_id = ?', [place_id]);
}

export async function listAddresses(limit = 50, offset = 0) {
  return getAll<Address>(
    `SELECT * FROM addresses ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export async function deleteAddress(id: number) {
  await run(`DELETE FROM addresses WHERE id = ?`, [id]);
}
