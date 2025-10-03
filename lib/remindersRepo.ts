// lib/remindersRepo.ts
import { getAll, getFirst, run } from './db';

export type ReminderRow = {
  id: number;
  event_id: number;
  place_id: string;

  event_date: string;                 // YYYY-MM-DD
  remind_date: string;
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

// ------- upsert -------
export async function upsertReminder(r: NewReminder) {
  const sql = `
      INSERT INTO reminders (
        event_id, place_id, event_date,remind_date, note,
        place_title, event_title, service_name, event_type
      )
      VALUES (
        $event_id, $place_id, $event_date, $remind_date, $note,
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
    $remind_date: r.remind_date,
    $note: r.note ?? null,
    $place_title: r.place_title ?? null,
    $event_title: r.event_title ?? null,
    $service_name: r.service_name ?? null,
    $event_type: r.event_type ?? null,
  });
}

// ------- reads -------
const SELECT_BASE = `
  id, event_id, place_id,
  event_date AS event_date,
  remind_date AS remind_date, 
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
      ORDER BY event_date ASC, id ASC`
  );
}

export async function listRemindersByPlace(placeId: string) {
  return getAll<ReminderRow>(
    `SELECT ${SELECT_BASE}
       FROM reminders
      WHERE place_id = ?
      ORDER BY event_date ASC, id ASC`,
    [placeId]
  );
}

export async function listRemindersByPlaceAndRange(placeId: string, after: string, before: string) {
  return getAll<ReminderRow>(
    `SELECT ${SELECT_BASE}
       FROM reminders
      WHERE place_id = ?
        AND event_date >= ?
        AND event_date <= ?
      ORDER BY event_date ASC, id ASC`,
    [placeId, after, before]
  );
}

/** Scheduler helper: does any reminder exist on this y-m-d? */
export async function hasReminderOnDate(placeId: string, ymd: string) {
  const row = await getFirst<{ c: number }>(
    `SELECT COUNT(1) AS c
       FROM reminders
      WHERE place_id = ?
        AND event_date = ?
      LIMIT 1`,
    [placeId, ymd]
  );
  return (row?.c ?? 0) > 0;
}
