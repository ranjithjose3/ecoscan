// services/EventsService.ts
import { toEventRow, upsertEvents, type ApiEvent } from '../lib/eventsRepo';

import Constants from 'expo-constants';
const AUTO_SYNC_MONTHS_AHEAD = Number(Constants.expoConfig?.extra?.AUTO_SYNC_MONTHS_AHEAD) || 4;

const SERVICE_ID = 1110;

/* ------------------------------- Date helpers ------------------------------ */
function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function toDate(d: string | Date): Date {
  return typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

function addMonthsSafe(d: Date, m: number) {
  const nd = new Date(d);
  const orig = nd.getDate();
  nd.setMonth(nd.getMonth() + m);
  if (nd.getDate() !== orig) nd.setDate(0);
  return nd;
}

/* ------------------------------- Fetch helper ------------------------------ */
async function fetchEventsJson(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    console.warn('[EventsService] JSON parse error', { url, error: e });
  }

  if (!res.ok) {
    console.warn('[EventsService] HTTP error', {
      status: res.status,
      statusText: res.statusText,
      url,
      bodyPreview: text?.slice(0, 300),
    });
    throw new Error(`Failed to fetch events: ${res.status} ${res.statusText}`);
  }

  console.log('[EventsService] fetch ok', {
    url,
    isArray: Array.isArray(json),
    keys: json && typeof json === 'object' && !Array.isArray(json)
      ? Object.keys(json).slice(0, 5)
      : undefined,
    len: Array.isArray(json?.events)
      ? json.events.length
      : Array.isArray(json)
      ? json.length
      : undefined,
  });

  return json;
}

function extractApiEvents(json: any): ApiEvent[] {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.events)) return json.events;
  return [];
}

/* ----------------------------- Core fetch/save ----------------------------- */
export async function syncEventsForPlace(
  placeId: string,
  after: string,
  before: string,
  locale = 'en'
): Promise<{ saved: number; total: number }> {
  const base = `https://api.recollect.net/api/places/${encodeURIComponent(placeId)}/services/${SERVICE_ID}/events`;
  const qs = `?nomerge=1&hide=reminder_only&after=${encodeURIComponent(after)}&before=${encodeURIComponent(before)}&locale=${encodeURIComponent(locale)}`;
  const url = base + qs;

  const json = await fetchEventsJson(url);
  const events = extractApiEvents(json);

  const rows = events.map((e) => toEventRow(e, placeId));
  if (rows.length > 0) {
    console.log('[EventsService] first row preview:', rows[0]);
  }

  const changed: number = await upsertEvents(rows);
  console.log('[EventsService] upsert result:', { typeof: typeof changed, value: changed });

  return { saved: Number.isFinite(changed) ? changed : 0, total: rows.length };
}

/* --------------------------- Flexible range helper ------------------------- */
export async function syncEventsForPlaceFlexible(opts: {
  placeId: string;
  startDate?: string | Date;
  endDate?: string | Date;
  monthsAhead?: number;
  padBeforeDays?: number;
  padAfterDays?: number;
  locale?: string;
}): Promise<{ saved: number; total: number; after: string; before: string }> {
  const {
    placeId,
    startDate,
    endDate,
    monthsAhead = AUTO_SYNC_MONTHS_AHEAD,
    padBeforeDays = 0,
    padAfterDays = 0,
    locale = 'en',
  } = opts;

  const start = startDate ? toDate(startDate) : new Date();
  const startPadded = addDays(start, -padBeforeDays);

  const end = endDate ? toDate(endDate) : addMonthsSafe(start, monthsAhead);
  const endPadded = addDays(end, padAfterDays);

  const after = fmt(startPadded);
  const before = fmt(endPadded);

  const result = await syncEventsForPlace(placeId, after, before, locale);
  console.log('[EventsService] syncEventsForPlaceFlexible:', {
    placeId,
    after,
    before,
    saved: result.saved,
    total: result.total,
  });

  return { ...result, after, before };
}
