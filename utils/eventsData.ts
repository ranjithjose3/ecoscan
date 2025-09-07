// utils/eventsData.ts
import { listEventsByPlaceAndRange, type EventRow } from '../lib/eventsRepo';
import { listRemindersByPlaceAndRange } from '../lib/remindersRepo';

/** Color mapping similar to your mock utils */
const typeColors: Record<string, string> = {
  garbage: '#9e9e9e',
  recycling: '#00adf5',
  yardwaste: '#FF9800',
  yard_waste: '#FF9800',
  green_bin: '#4CAF50',
  organics: '#4CAF50',
};

function colorForEvent(e: EventRow): string {
  const key =
    (e.name ?? '').toLowerCase() ||
    (e.subject ?? '').toLowerCase() ||
    (e.event_type ?? '').toLowerCase();

  for (const k of Object.keys(typeColors)) {
    if (key.includes(k)) return typeColors[k];
  }
  return '#607D8B';
}

function toTitle(e: EventRow): string {
  const n = e.subject ?? e.name ?? e.event_type ?? 'Collection';
  return capitalize(n);
}

/** SQLite → AgendaList sections: [{ title: 'YYYY-MM-DD', data: [...] }] */
export async function getAgendaItemsFromDb(
  placeId: string,
  after: string,  // 'YYYY-MM-DD'
  before: string, // 'YYYY-MM-DD'
) {
  // Preload events and reminders once for the range
  const [rows, reminders] = await Promise.all([
    listEventsByPlaceAndRange(placeId, after, before),
    listRemindersByPlaceAndRange(placeId, after, before), // uses event_date range
  ]);

  // Quick lookup: which event_ids already have reminders?
  const reminderEventIds = new Set(reminders.map(r => r.event_id));

  const grouped: Record<string, Array<{
    id: number;
    place_id: string;
    day: string;
    hour: string;
    title: string;
    name?: string | null;
    subject?: string | null;
    custom_subject?: string | null;
    custom_message?: string | null;
    event_type?: string | null;
    service_name?: string | null;
    is_week_long?: number | null;
    zone_id?: number | null;
    created_at?: string;
    updated_at?: string;
    hasReminder: boolean;
  }>> = {};

  for (const e of rows) {
    if (!grouped[e.day]) grouped[e.day] = [];

    grouped[e.day].push({
      id: e.id,                 // <-- needed by AgendaItem
      place_id: e.place_id,     // <-- needed by AgendaItem (fallback)
      day: e.day,               // <-- needed by AgendaItem
      hour: 'All day',
      title: toTitle(e),
      name: e.name ?? null,
      subject: e.subject ?? null,
      custom_subject: e.custom_subject ?? null,
      custom_message: e.custom_message ?? null,
      event_type: e.event_type ?? null,
      service_name: e.service_name ?? null,
      is_week_long: e.is_week_long ?? null,
      zone_id: e.zone_id ?? null,
      created_at: (e as any).created_at,
      updated_at: (e as any).updated_at,
      hasReminder: reminderEventIds.has(e.id), // <-- precomputed
    });
  }

  return Object.keys(grouped)
    .sort()
    .map((date) => ({
      title: date,
      data: grouped[date],
    }));
}

/** SQLite → markedDates: { 'YYYY-MM-DD': { dots: [{color}], marked: true }, ... } */
export async function getMarkedDatesFromDb(
  placeId: string,
  after: string,
  before: string,
) {
  const rows = await listEventsByPlaceAndRange(placeId, after, before);
  const dates: Record<string, { dots: Array<{ color: string }>; marked: boolean }> = {};

  for (const e of rows) {
    const day = e.day;
    if (!dates[day]) dates[day] = { dots: [], marked: true };

    const color = colorForEvent(e);
    if (!dates[day].dots.some((d) => d.color === color)) {
      dates[day].dots.push({ color });
    }
  }
  return dates;
}

/** (Optional) reminder days (based on event_date) to add a purple dot in calendar */
export async function getReminderDatesFromDb(
  placeId: string,
  after: string,
  before: string,
) {
  const rems = await listRemindersByPlaceAndRange(placeId, after, before);
  return new Set(rems.map(r => r.event_date));
}

/* ------------------------------- date helpers ------------------------------ */
function pad2(n: number) { return String(n).padStart(2, '0'); }
export function fmt(d: Date): string { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
export function addMonthsSafe(d: Date, m: number) {
  const nd = new Date(d);
  const orig = nd.getDate();
  nd.setMonth(nd.getMonth() + m);
  if (nd.getDate() !== orig) nd.setDate(0);
  return nd;
}
function capitalize(s: string) { return s.replace(/\b\w/g, (l) => l.toUpperCase()); }
