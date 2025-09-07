// components/EventsList.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { ActivityIndicator, List, Text, useTheme } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { listEventsByPlaceAndRange, type EventRow } from '../lib/eventsRepo';
import { useLocation } from '../context/LocationContext';

import Constants from 'expo-constants';
const AUTO_SYNC_MONTHS_AHEAD = Number(Constants.expoConfig?.extra?.AUTO_SYNC_MONTHS_AHEAD) || 4;

/* ------------------------------- date helpers ------------------------------ */
function pad2(n: number) { return String(n).padStart(2, '0'); }
function fmt(d: Date): string { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function toDate(d?: string | Date): Date { return typeof d === 'string' ? new Date(d + 'T00:00:00') : (d ?? new Date()); }
function addMonthsSafe(d: Date, m: number) {
  const nd = new Date(d);
  const orig = nd.getDate();
  nd.setMonth(nd.getMonth() + m);
  if (nd.getDate() !== orig) nd.setDate(0);
  return nd;
}

/* ---------------------------------- props --------------------------------- */
type Props = {
  placeId?: string;          // you can pass this OR let it read from context
  startDate?: string | Date; // default: today
  endDate?: string | Date;   // if not provided, monthsAhead is used
  monthsAhead?: number;      // default: 1
  emptyText?: string;
};

export default function EventsList({
  placeId: placeIdProp,
  startDate,
  endDate,
  monthsAhead = AUTO_SYNC_MONTHS_AHEAD,
  emptyText = 'No events in this period.',
}: Props) {
  const theme = useTheme();
  const { location, syncing, lastSyncAt } = useLocation();
  const placeId = placeIdProp ?? location?.place_id;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const prevSyncing = useRef(syncing);

  const { after, before } = useMemo(() => {
    const start = toDate(startDate);
    const end = endDate ? toDate(endDate) : addMonthsSafe(start, monthsAhead);
    return { after: fmt(start), before: fmt(end) };
  }, [startDate, endDate, monthsAhead]);

  const load = useCallback(async () => {
    if (!placeId) {
      setEvents([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await listEventsByPlaceAndRange(placeId, after, before);
      setEvents(rows);
    } catch (e) {
      console.warn('EventsList load error:', e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [placeId, after, before]);

  const refresh = useCallback(async () => {
    if (!placeId) return;
    setRefreshing(true);
    try {
      const rows = await listEventsByPlaceAndRange(placeId, after, before);
      setEvents(rows);
    } catch (e) {
      console.warn('EventsList refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [placeId, after, before]);

  // Load when the screen focuses
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Reload if placeId or date window changes
  useEffect(() => { load(); }, [load]);

  // 🔔 Reload when a sync completes (syncing true -> false) OR when lastSyncAt ticks
  useEffect(() => {
    if (prevSyncing.current && !syncing) {
      // transition true -> false
      load();
    }
    prevSyncing.current = syncing;
  }, [syncing, load]);

  useEffect(() => {
    if (lastSyncAt) {
      load();
    }
  }, [lastSyncAt, load]);

  if (!placeId) {
    return <Text style={{ color: theme.colors.onSurface, opacity: 0.7 }}>Select a location to view events.</Text>;
  }

  if (loading) {
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={{ paddingVertical: 8 }}>
        <Text style={{ color: theme.colors.onSurface, opacity: 0.7 }}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      renderItem={({ item }) => {
        const title = `${item.day} — ${item.subject ?? item.name ?? item.event_type ?? 'Event'}`;
        const subtitleParts = [
          item.service_name,
          item.event_type && item.event_type !== 'pickup' ? item.event_type : undefined,
          item.name,
        ].filter(Boolean);

        return (
          <List.Item
            title={title}
            description={subtitleParts.join(' • ') || undefined}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
        );
      }}
    />
  );
}
