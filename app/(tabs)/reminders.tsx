import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import {
  Button,
  Card,
  Text,
  useTheme,
  Divider,
  Chip,
  Portal,
  Dialog,
  IconButton,
} from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import ScreenLayout from '../../components/ScreenLayout';
import { listAllReminders, deleteReminderById, type ReminderRow } from '../../lib/remindersRepo';
import { fmt } from '../../utils/eventsData';
import { remindersBus } from '../../lib/remindersBus';

// ✅ Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function ymdToday() {
  return fmt(new Date());
}

export default function ReminderScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmRow, setConfirmRow] = useState<ReminderRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const today = useMemo(() => ymdToday(), []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission for notifications not granted!');
        }
      } catch (err) {
        console.error('Error requesting notification permissions:', err);
      }
    })();
  }, []);

  const scheduleReminder = async () => {
    try {
      const trigger = new Date(Date.now() + 10 * 1000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder 📌',
          body: 'This is your scheduled reminder (10 sec after now)!'
        },
        trigger: { date: trigger },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const rows = await listAllReminders();
      const upcoming = rows.filter(r => (r.event_date ?? '') >= today);
      setReminders(upcoming);
    } catch (e) {
      console.error('[ReminderScreen] load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = remindersBus.on(() => load());
    return unsubscribe;
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const openConfirm = (row: ReminderRow) => {
    setConfirmRow(row);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setTimeout(() => setConfirmRow(null), 150);
  };

  const confirmRemove = async () => {
    const row = confirmRow;
    if (!row) return;
    try {
      await deleteReminderById(row.id);
      setReminders(prev => prev.filter(r => r.id !== row.id));
      remindersBus.emit({
        event_id: row.event_id,
        place_id: row.place_id,
        hasReminder: false
      });
    } catch (e) {
      console.error('[ReminderScreen] remove error:', e);
    } finally {
      closeConfirm();
    }
  };

  const renderItem = ({ item }: { item: ReminderRow }) => {
    const title = item.event_title || item.service_name || 'Reminder';
    const address = item.place_title || item.place_id || '';

    return (
      <Card mode="elevated" style={styles.card}>
        <View style={styles.row}>
          {/* LEFT */}
          <View style={styles.leftCol}>
            <View style={styles.topLine}>
              <Chip
                compact
                style={[styles.dateChip, { backgroundColor: theme.colors.primaryContainer }]}
                textStyle={{
                  color: theme.colors.onPrimaryContainer,
                  fontSize: 11,
                  lineHeight: 13,
                  fontWeight: '700',
                }}
              >
                {item.event_date}
              </Chip>

              <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
                {title}
              </Text>
            </View>

            {!!address && (
              <View style={styles.addrRow}>
                <Text style={[styles.addrIcon, { color: theme.colors.onSurfaceVariant }]}>📍</Text>
                <Text style={[styles.address, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                  {address}
                </Text>
              </View>
            )}

            {!!item.note && (
              <View style={styles.noteRow}>
                <Text style={[styles.addrIcon, { color: theme.colors.onSurfaceVariant }]}>📝</Text>
                <Text style={[styles.note, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
                  {item.note}
                </Text>
              </View>
            )}
          </View>

          {/* RIGHT — top kebab */}
          <View style={styles.rightCol}>
            <IconButton
              icon="dots-vertical"
              size={22}
              onPress={() => openConfirm(item)}
              accessibilityLabel="Reminder options"
              iconColor={theme.colors.onSurfaceVariant}
              style={styles.kebab}
            />
          </View>
        </View>
      </Card>
    );
  };

  const listBottomPadding = Math.max(24, insets.bottom + 16);

  return (
    <>
      <ScreenLayout
        title="Reminders"
        subtitle="Manage your eco-task reminders"
        contentStyle={{ paddingHorizontal: 1, paddingVertical: 0 }}
        scrollable={false}
      >
        <Card style={{ margin: 12 }}>
          <Card.Content>
            <Text style={[styles.text, { color: theme.colors.onSurface }]}>
              Schedule reminders for eco-tasks! Press the button below, and you'll be notified after 10 seconds.
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={scheduleReminder}>
              Schedule Test Reminder (10 sec)
            </Button>
          </Card.Actions>
        </Card>

        <Divider style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

        {reminders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              No upcoming reminders. Add one from the calendar.
            </Text>
          </View>
        ) : (
          <FlatList
            data={reminders}
            keyExtractor={(r) => String(r.id)}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={load}
                tintColor={theme.colors.primary}
              />
            }
            contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPadding }]}
            removeClippedSubviews={false}
          />
        )}
      </ScreenLayout>

      {/* Confirmation dialog */}
      <Portal>
        <Dialog
          visible={confirmOpen}
          onDismiss={closeConfirm}
          style={styles.dialog}
          theme={{ colors: { backdrop: 'rgba(0,0,0,0.72)' } }}
        >
          <Dialog.Title style={{ fontWeight: '800' }}>Remove reminder?</Dialog.Title>
          <Dialog.Content>
            {!!confirmRow && (
              <>
                <View style={styles.confirmTopLine}>
                  <Chip
                    compact
                    style={[styles.dateChip, { backgroundColor: theme.colors.primaryContainer }]}
                    textStyle={{
                      color: theme.colors.onPrimaryContainer,
                      fontSize: 11,
                      lineHeight: 13,
                      fontWeight: '700'
                    }}
                  >
                    {confirmRow.event_date}
                  </Chip>
                  <Text style={[styles.confirmTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
                    {confirmRow.event_title || confirmRow.service_name || 'Reminder'}
                  </Text>
                </View>
                {!!(confirmRow.place_title || confirmRow.place_id) && (
                  <Text style={{ marginTop: 6, color: theme.colors.onSurfaceVariant }}>
                    📍 {confirmRow.place_title || confirmRow.place_id}
                  </Text>
                )}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions style={styles.actions}>
            <View style={styles.actionsRow}>
              <Button
                mode="outlined"
                icon="close"
                onPress={closeConfirm}
                style={[styles.actionBtn, styles.cancelBtn]}
                contentStyle={styles.actionContent}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                icon="check"
                onPress={confirmRemove}
                style={[styles.actionBtn, styles.removeBtnPill]}
                contentStyle={styles.actionContent}
              >
                Remove
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  text: { marginBottom: 10 },
  divider: { marginTop: 8, marginBottom: 4 },

  listContent: { paddingHorizontal: 12, paddingTop: 6 },

  card: {
    borderRadius: 12,
    marginVertical: 4,
    overflow: 'hidden', // keep ripple/elevation clean
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  leftCol: { flex: 1, paddingRight: 8, justifyContent: 'center' },
  rightCol: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  kebab: { margin: 0, padding: 4 },

  topLine: { flexDirection: 'row', alignItems: 'center', minHeight: 28 },

  dateChip: { marginRight: 8, borderRadius: 10, paddingVertical: 0 },

  title: { fontSize: 14, fontWeight: '700', flexShrink: 1 },

  addrRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  addrIcon: { fontSize: 12, marginRight: 6 },
  address: { fontSize: 12, flexShrink: 1 },
  note: { fontSize: 12, flexShrink: 1, fontStyle: 'italic' },

  emptyWrap: { paddingHorizontal: 16, paddingVertical: 24 },

  dialog: { borderRadius: 16 },
  confirmTopLine: { flexDirection: 'row', alignItems: 'center', minHeight: 28 },
  confirmTitle: { fontSize: 16, fontWeight: '700', flexShrink: 1, marginLeft: 8 },

  actions: { paddingHorizontal: 16, paddingBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  actionBtn: { flex: 1, borderRadius: 999 },
  actionContent: { height: 44 },
  cancelBtn: { borderWidth: StyleSheet.hairlineWidth },
  removeBtnPill: {},
});
