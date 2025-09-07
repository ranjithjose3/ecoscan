// components/calender/AgendaItem.tsx
import isEmpty from 'lodash/isEmpty';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Text, Portal, Modal, Surface, useTheme, IconButton, Button } from 'react-native-paper';
import testIDs from '../../utils/testIDs';
import { useLocation } from '../../context/LocationContext';
import { upsertReminder, deleteReminderByEvent, getReminderByEvent } from '../../lib/remindersRepo';
import { remindersBus } from '../../lib/remindersBus';

type AgendaEventItem = {
  id: number;
  place_id: string;
  day: string;                    // YYYY-MM-DD
  title: string;

  name?: string | null;
  subject?: string | null;
  custom_subject?: string | null;
  custom_message?: string | null;
  event_type?: string | null;
  service_name?: string | null;

  hasReminder?: boolean;          // precomputed by utils/eventsData.ts
};

interface ItemProps {
  item: AgendaEventItem | Record<string, never>;
}

const AgendaItem = ({ item }: ItemProps) => {
  const theme = useTheme();
  const { location } = useLocation();

  const [visible, setVisible] = useState(false);
  const [hasReminder, setHasReminder] = useState<boolean>(!!(item as AgendaEventItem)?.hasReminder);
  const [pending, setPending] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  // Sync local state when the event changes or when parent precomputed hasReminder changes
  useEffect(() => {
    const it = item as AgendaEventItem;
    setHasReminder(!!it?.hasReminder);
  }, [(item as AgendaEventItem)?.id, (item as AgendaEventItem)?.place_id, (item as AgendaEventItem)?.day]);

  // Defensive warm-up if hasReminder wasn't provided
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const it = item as AgendaEventItem;
      const placeId = location?.place_id ?? it?.place_id;
      if (it?.id && placeId && typeof it.hasReminder === 'undefined') {
        try {
          const existing = await getReminderByEvent(it.id, placeId);
          if (!cancelled) setHasReminder(!!existing);
        } catch (e) {
          console.error('[AgendaItem] warmup getReminderByEvent failed:', e);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [(item as AgendaEventItem)?.id, (item as AgendaEventItem)?.hasReminder, location?.place_id]);

  // 🔁 Listen for cross-screen changes (e.g. deletions from ReminderScreen)
  useEffect(() => {
    const it = item as AgendaEventItem;
    const unsubscribe = remindersBus.on((chg) => {
      const placeId = location?.place_id ?? it?.place_id;
      if (!placeId || chg.place_id !== placeId) return;
      if (chg.event_id === it.id) {
        setHasReminder(chg.hasReminder);
      }
    });
    return unsubscribe;
  }, [item, location?.place_id]);

  const onPressRow = useCallback(() => {}, []);

  const toggleReminder = useCallback(async () => {
    if (pending) return;
    const it = item as AgendaEventItem;
    const placeId = location?.place_id ?? it?.place_id;

    if (!it?.id) return Alert.alert('Oops', 'Missing event id.');
    if (!placeId) return Alert.alert('Oops', 'Missing place id.');

    try {
      setPending(true);
      const exists = await getReminderByEvent(it.id, placeId);
      if (exists) {
        await deleteReminderByEvent(it.id, placeId);
        setHasReminder(false);
        remindersBus.emit({ event_id: it.id, place_id: placeId, hasReminder: false });
      } else {
        await upsertReminder({
          event_id: it.id,
          place_id: placeId,
          event_date: it.day,
          note: null,
          place_title: location?.title ?? null,
          event_title: it.title ?? null,
          service_name: it.service_name ?? null,
          event_type: it.event_type ?? null,
        });
        setHasReminder(true);
        remindersBus.emit({ event_id: it.id, place_id: placeId, hasReminder: true });
      }
    } catch (e) {
      console.error('[AgendaItem] toggleReminder failed:', e);
      Alert.alert('Error', 'Unable to update reminder. See console for details.');
    } finally {
      setPending(false);
    }
  }, [item, location?.place_id, location?.title, pending]);

  if (isEmpty(item)) {
    return (
      <View style={[styles.emptyItem, { borderBottomColor: theme.colors.outlineVariant }]}>
        <Text style={[styles.emptyItemText, { color: theme.colors.onSurfaceVariant }]}>
          No Events Planned Today
        </Text>
      </View>
    );
  }

  const it = item as AgendaEventItem;
  const subline = it.custom_subject ?? it.subject ?? '';

  const bellIcon = hasReminder ? 'bell-ring' : 'bell-plus-outline';
  const bellColor = pending
    ? (theme.colors as any).onSurfaceDisabled ?? theme.colors.onSurface
    : hasReminder
      ? theme.colors.primary
      : theme.colors.onSurfaceVariant;
  const viewIconColor = theme.colors.onSurfaceVariant;

  return (
    <>
      <TouchableOpacity
        onPress={onPressRow}
        style={[
          styles.item,
          { borderBottomColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface },
        ]}
        testID={testIDs.agenda.ITEM}
      >
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={2}>
            {it.title}
          </Text>
          {!!subline && (
            <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
              {subline}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <IconButton
            icon="eye-outline"
            onPress={() => setVisible(true)}
            accessibilityLabel="View details"
            color={viewIconColor}
            iconColor={viewIconColor}
            style={styles.iconBtn}
          />
          <IconButton
            icon={bellIcon}
            onPress={toggleReminder}
            disabled={pending}
            accessibilityLabel={hasReminder ? 'Remove reminder' : 'Add reminder'}
            color={bellColor}
            iconColor={bellColor}
            style={styles.iconBtn}
          />
        </View>
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}
        >
          <Surface style={styles.modalSurface} elevation={0}>
            <Text variant="titleMedium" style={styles.modalTitle}>{it.title}</Text>
            <Text variant="bodyMedium"><Text style={styles.label}>Subject:</Text> {it.custom_subject || it.subject || 'N/A'}</Text>
            <Text variant="bodyMedium"><Text style={styles.label}>Message:</Text> {it.custom_message || 'No message available.'}</Text>
            <Text variant="bodyMedium"><Text style={styles.label}>Event Type:</Text> {it.event_type || '—'}</Text>
            <Text variant="bodyMedium"><Text style={styles.label}>Service:</Text> {it.service_name || '—'}</Text>
            <Button mode="outlined" style={styles.modalClose} onPress={() => setVisible(false)}>Close</Button>
          </Surface>
        </Modal>
      </Portal>
    </>
  );
};

export default React.memo(AgendaItem);

const styles = StyleSheet.create({
  item: { padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  textCol: { flex: 1, paddingRight: 12 },
  title: { fontWeight: 'bold', fontSize: 16 },
  subtitle: { marginTop: 4, fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { marginHorizontal: 2 },
  emptyItem: { paddingLeft: 16, height: 52, justifyContent: 'center', borderBottomWidth: 1 },
  emptyItemText: { fontSize: 14 },
  modalContent: { margin: 20, borderRadius: 8, padding: 20 },
  modalSurface: { padding: 10, borderRadius: 8 },
  modalTitle: { fontWeight: 'bold', marginBottom: 10 },
  label: { fontWeight: '600' },
  modalClose: { marginTop: 20, alignSelf: 'flex-end' },
});
