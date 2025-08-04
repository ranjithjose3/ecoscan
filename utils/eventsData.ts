// utils/eventsData.ts
import { listEventsByPlaceAndRange, type EventRow } from '../lib/eventsRepo';

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

/** SQLite → AgendaList sections: [{ title: 'YYYY-MM-DD', data: [{ hour, title }, ...] }] */
export async function getAgendaItemsFromDb(
  placeId: string,
  after: string,  // 'YYYY-MM-DD'
  before: string, // 'YYYY-MM-DD'
) {
  const rows = await listEventsByPlaceAndRange(placeId, after, before);

  //console.log('[getAgendaItemsFromDb] Rows:', rows[0]);

  const grouped: Record<string, Array<{
    hour: string;
    title: string;
    name: string;
    subject: string;
    custom_subject?: string;
    custom_message?: string;
    event_type: string;
    service_name: string;
    is_week_long: number;
    zone_id: number;
    created_at: string;
    updated_at: string;
  }>> = {};

  for (const e of rows) {
    if (!grouped[e.day]) grouped[e.day] = [];

    grouped[e.day].push({
      hour: 'All day',
      title: toTitle(e),
      name: e.name,
      subject: e.subject,
      custom_subject: e.custom_subject,
      custom_message: e.custom_message,
      event_type: e.event_type,
      service_name: e.service_name,
      is_week_long: e.is_week_long,
      zone_id: e.zone_id,
      created_at: e.created_at,
      updated_at: e.updated_at,
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
  const dates: Record<
    string,
    { dots: Array<{ color: string }>; marked: boolean }
  > = {};

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
function capitalize(s: string) {
  return s.replace(/\b\w/g, (l) => l.toUpperCase());
}
