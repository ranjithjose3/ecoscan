// lib/remindersRepo.ts
import { getAll, getFirst, run, getDb } from './db';

export type ReminderRow = {
  id: number;
  event_id: number;
  place_id: string;

  event_date: string;                 // normalized in SELECT via COALESCE
  note?: string | null;

  // snapshots for UI
  place_title?: string | null;
  event_title?: string | null;
  service_name?: string | null;
  event_type?: string | null;

  created_at?: string;
  updated_at?: string;
};

export type NewReminder = Omit<ReminderRow, 'id' | 'created_at' | 'updated_at'>;

// ------- schema probe (cached) -------
let _hasRemindDate: boolean | null = null;
async function hasRemindDateColumn(): Promise<boolean> {
  if (_hasRemindDate != null) return _hasRemindDate;
  const db = await getDb();
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(reminders)`);
  _hasRemindDate = cols.some(c => c.name === 'remind_date');
  return _hasRemindDate!;
}

// ------- upsert (writes remind_date if legacy column exists) -------
export async function upsertReminder(r: NewReminder) {
  const legacy = await hasRemindDateColumn();

  const sql = legacy
    ? `
      INSERT INTO reminders (
        event_id, place_id, event_date, remind_date, note,
        place_title, event_title, service_name, event_type
      )
      VALUES (
        $event_id, $place_id, $event_date, $event_date, $note,
        $place_title, $event_title, $service_name, $event_type
      )
      ON CONFLICT(event_id, place_id) DO UPDATE SET
        event_date   = excluded.event_date,
        remind_date  = excluded.event_date,
        note         = excluded.note,
        place_title  = excluded.place_title,
        event_title  = excluded.event_title,
        service_name = excluded.service_name,
        event_type   = excluded.event_type
    `
    : `
      INSERT INTO reminders (
        event_id, place_id, event_date, note,
        place_title, event_title, service_name, event_type
      )
      VALUES (
        $event_id, $place_id, $event_date, $note,
        $place_title, $event_title, $service_name, $event_type
      )
      ON CONFLICT(event_id, place_id) DO UPDATE SET
        event_date   = excluded.event_date,
        note         = excluded.note,
        place_title  = excluded.place_title,
        event_title  = excluded.event_title,
        service_name = excluded.service_name,
        event_type   = excluded.event_type
    `;

  return run(sql, {
    $event_id: r.event_id,
    $place_id: r.place_id,
    $event_date: r.event_date,
    $note: r.note ?? null,
    $place_title: r.place_title ?? null,
    $event_title: r.event_title ?? null,
    $service_name: r.service_name ?? null,
    $event_type: r.event_type ?? null,
  });
}

// ------- reads (normalize date with COALESCE so old rows work) -------
const SELECT_BASE = `
  id, event_id, place_id,
  COALESCE(event_date, remind_date) AS event_date,
  note, place_title, event_title, service_name, event_type,
  created_at, updated_at
`;

export async function getReminderByEvent(eventId: number, placeId: string) {
  return getFirst<ReminderRow>(
    `SELECT ${SELECT_BASE}
       FROM reminders
      WHERE event_id = ? AND place_id = ?
      LIMIT 1`,
    [eventId, placeId]
  );
}

export async function deleteReminderByEvent(eventId: number, placeId: string) {
  return run(`DELETE FROM reminders WHERE event_id = ? AND place_id = ?`, [eventId, placeId]);
}

export async function deleteReminderById(id: number) {
  return run(`DELETE FROM reminders WHERE id = ?`, [id]);
}

export async function listAllReminders() {
  return getAll<ReminderRow>(
    `SELECT ${SELECT_BASE}
       FROM reminders
      ORDER BY COALESCE(event_date, remind_date) ASC, id ASC`
  );
}

export async function listRemindersByPlace(placeId: string) {
  return getAll<ReminderRow>(
    `SELECT ${SELECT_BASE}
       FROM reminders
      WHERE place_id = ?
      ORDER BY COALESCE(event_date, remind_date) ASC, id ASC`,
    [placeId]
  );
}

export async function listRemindersByPlaceAndRange(placeId: string, after: string, before: string) {
  return getAll<ReminderRow>(
    `SELECT ${SELECT_BASE}
       FROM reminders
      WHERE place_id = ?
        AND COALESCE(event_date, remind_date) >= ?
        AND COALESCE(event_date, remind_date) <= ?
      ORDER BY COALESCE(event_date, remind_date) ASC, id ASC`,
    [placeId, after, before]
  );
}

/** Scheduler helper: does any reminder exist on this y-m-d? */
export async function hasReminderOnDate(placeId: string, ymd: string) {
  const row = await getFirst<{ c: number }>(
    `SELECT COUNT(1) AS c
       FROM reminders
      WHERE place_id = ?
        AND COALESCE(event_date, remind_date) = ?
      LIMIT 1`,
    [placeId, ymd]
  );
  return (row?.c ?? 0) > 0;
}
