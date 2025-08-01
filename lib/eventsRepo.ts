// lib/eventsRepo.ts
import { getAll, run, withTransaction, getDb } from './db';

/** Row stored in SQLite */
export type EventRow = {
  id: number;
  place_id: string;
  day: string;              // YYYY-MM-DD
  zone_id?: number | null;
  custom_message?: string | null;
  custom_subject?: string | null;
  is_week_long?: number | null;  // 0/1
  event_type?: string | null;
  short_text_message?: string | null;
  name?: string | null;
  plain_text_message?: string | null;
  area_name?: string | null;
  service_name?: string | null;
  subject?: string | null;
};

export type ApiEvent = {
  id: number;
  day: string;
  zone_id?: number;
  custom_message?: string | null;
  custom_subject?: string | null;
  flags?: Array<{
    is_week_long?: number | 0 | 1 | boolean;
    event_type?: string | null;
    short_text_message?: string | null;
    name?: string | null;
    plain_text_message?: string | null;
    area_name?: string | null;
    service_name?: string | null;
    subject?: string | null;
  }>;
};

export function toEventRow(e: ApiEvent, placeId: string): EventRow {
  const f = e.flags && e.flags.length > 0 ? e.flags[0] : undefined;
  const to01 = (v: any) =>
    v == null ? null : typeof v === 'boolean' ? (v ? 1 : 0) : Number(v);

  return {
    id: e.id,
    place_id: placeId,
    day: e.day,
    zone_id: e.zone_id ?? null,
    custom_message: e.custom_message ?? null,
    custom_subject: e.custom_subject ?? null,
    is_week_long: to01(f?.is_week_long),
    event_type: f?.event_type ?? null,
    short_text_message: f?.short_text_message ?? null,
    name: f?.name ?? null,
    plain_text_message: f?.plain_text_message ?? null,
    area_name: f?.area_name ?? null,
    service_name: f?.service_name ?? null,
    subject: f?.subject ?? null,
  };
}

const UPSERT_SQL = `
  INSERT INTO events
    (id, place_id, day, zone_id, custom_message, custom_subject, is_week_long, event_type,
     short_text_message, name, plain_text_message, area_name, service_name, subject)
  VALUES
    ($id, $place_id, $day, $zone_id, $custom_message, $custom_subject, $is_week_long, $event_type,
     $short_text_message, $name, $plain_text_message, $area_name, $service_name, $subject)
  ON CONFLICT(id) DO UPDATE SET
    place_id = excluded.place_id,
    day      = excluded.day,
    zone_id  = excluded.zone_id,
    custom_message = excluded.custom_message,
    custom_subject = excluded.custom_subject,
    is_week_long   = excluded.is_week_long,
    event_type = excluded.event_type,
    short_text_message = excluded.short_text_message,
    name = excluded.name,
    plain_text_message = excluded.plain_text_message,
    area_name = excluded.area_name,
    service_name = excluded.service_name,
    subject = excluded.subject
`;

/** Upsert 1 event; always returns a number. */
export async function upsertEvent(row: EventRow): Promise<number> {
  const res = await run(UPSERT_SQL, {
    $id: row.id,
    $place_id: row.place_id,
    $day: row.day,
    $zone_id: row.zone_id ?? null,
    $custom_message: row.custom_message ?? null,
    $custom_subject: row.custom_subject ?? null,
    $is_week_long: row.is_week_long ?? null,
    $event_type: row.event_type ?? null,
    $short_text_message: row.short_text_message ?? null,
    $name: row.name ?? null,
    $plain_text_message: row.plain_text_message ?? null,
    $area_name: row.area_name ?? null,
    $service_name: row.service_name ?? null,
    $subject: row.subject ?? null,
  });

  if (typeof (res as any)?.changes === 'number') {
    return (res as any).changes;
  }
  const db = await getDb();
  const ch = await db.getFirstAsync<{ c: number }>('SELECT changes() AS c');
  return Number(ch?.c) || 0;
}

/** Upsert many events; always returns a number. */
export async function upsertEvents(rows: EventRow[]): Promise<number> {
  if (!rows.length) return 0;

  return withTransaction<number>(async (db) => {
    const stmt = await db.prepareAsync(UPSERT_SQL);
    try {
      let changed: number = 0;

      for (const r of rows) {
        const execRes: any = await stmt.executeAsync({
          $id: r.id,
          $place_id: r.place_id,
          $day: r.day,
          $zone_id: r.zone_id ?? null,
          $custom_message: r.custom_message ?? null,
          $custom_subject: r.custom_subject ?? null,
          $is_week_long: r.is_week_long ?? null,
          $event_type: r.event_type ?? null,
          $short_text_message: r.short_text_message ?? null,
          $name: r.name ?? null,
          $plain_text_message: r.plain_text_message ?? null,
          $area_name: r.area_name ?? null,
          $service_name: r.service_name ?? null,
          $subject: r.subject ?? null,
        });

        if (typeof execRes?.changes === 'number') {
          changed += execRes.changes;
        } else {
          const ch = await db.getFirstAsync<{ c: number }>('SELECT changes() AS c');
          changed += Number(ch?.c) || 0;
        }
      }

      // Extra debug to confirm:
      console.log('[eventsRepo] upsertEvents: rows=', rows.length, 'changed=', changed);
      return Number(changed) || 0;
    } finally {
      await stmt.finalizeAsync();
    }
  });
}

/** Query helpers */
export async function listEventsByPlaceAndRange(
  placeId: string,
  after: string,
  before: string
) {
  return getAll<EventRow>(
    `SELECT * FROM events
     WHERE place_id = ? AND day >= ? AND day <= ?
     ORDER BY day ASC, id ASC`,
    [placeId, after, before]
  );
}
