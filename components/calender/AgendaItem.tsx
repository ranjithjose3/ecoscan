import React, { useCallback, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Button, Portal, Modal, Surface, useTheme, TextInput } from 'react-native-paper';
import testIDs from '../../utils/testIDs';
import { useLocation } from '../../context/LocationContext';
import { upsertReminder, getReminderByEvent, type NewReminder } from '../../lib/remindersRepo';

interface ItemProps {
  item: any;
}

// Replace lodash isEmpty with simple utility
function isEmpty(obj: any): boolean {
  return obj == null || Object.keys(obj).length === 0;
}

const AgendaItem = ({ item }: ItemProps) => {
  const [visible, setVisible] = useState(false);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderNote, setReminderNote] = useState('');
  const [hasReminder, setHasReminder] = useState(false);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const { location } = useLocation();

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const checkExistingReminder = useCallback(async () => {
    if (!location?.place_id || !item.id) return;

    try {
      // Extract event ID from the item ID (format: "eventId-date")
      const eventId = parseInt(item.id.split('-')[0]);
      const existing = await getReminderByEvent(eventId, location.place_id);
      setHasReminder(!!existing);
      if (existing?.note) {
        setReminderNote(existing.note);
      }
    } catch (error) {
      console.error('Error checking existing reminder:', error);
    }
  }, [location?.place_id, item.id]);

  React.useEffect(() => {
    checkExistingReminder();
  }, [checkExistingReminder]);

  const handleAddReminder = () => {
    setReminderModalVisible(true);
  };

  const handleSaveReminder = async () => {
    if (!location?.place_id || !item.id) return;

    setLoading(true);
    try {
      // Extract event ID from the item ID (format: "eventId-date")
      const eventId = parseInt(item.id.split('-')[0]);
      const eventDate = item.id.split('-').slice(1).join('-'); // Get date part
      console.log('Saving reminder for event:', eventId, 'at location:', location.place_id, 'on date:', eventDate);


      const newReminder: NewReminder = {
        event_id: eventId,
        place_id: location.place_id,
        event_date: eventDate,
        remind_date: eventDate,
        note: reminderNote.trim() || null,
        place_title: location.title,
        event_title: item.title,
        service_name: item.service_name,
        event_type: item.event_type,
      };

      await upsertReminder(newReminder);
      setHasReminder(true);
      setReminderModalVisible(false);
    } catch (error) {
      console.error('Error saving reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const itemPressed = useCallback(() => {
    // Optional: Handle main row press
  }, [item]);

  if (isEmpty(item)) {
    return (
      <View style={[styles.emptyItem, { borderBottomColor: theme.colors.outlineVariant }]}>
        <Text style={[styles.emptyItemText, { color: theme.colors.onSurfaceVariant }]}>
          No Events Planned Today
        </Text>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={itemPressed}
        style={[styles.item, { borderBottomColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}
        testID={testIDs.agenda.ITEM}
      >
        <View>
          <Text style={{ color: theme.colors.onSurface }}>{item.hour}</Text>
          {item.duration && (
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 4, marginLeft: 4 }}>
              {item.duration}
            </Text>
          )}
        </View>
        <Text style={[styles.itemTitleText, { color: theme.colors.onSurface }]}>{item.title}</Text>
        <View style={styles.itemButtonContainer}>
          <Button mode="text" onPress={showModal}>
            Info
          </Button>
          <Button
            mode={hasReminder ? "contained" : "outlined"}
            onPress={handleAddReminder}
            icon={hasReminder ? "bell" : "bell-plus"}
            compact
          >
            {hasReminder ? "✓" : "Remind"}
          </Button>
        </View>
      </TouchableOpacity>

      {/* Info Modal */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}
        >
          <Surface style={styles.modalSurface} elevation={0}>
            <Text variant="titleMedium" style={styles.modalTitle}>{item.title}</Text>

            <Text variant="bodyMedium"><Text style={styles.label}>Subject:</Text> {item.custom_subject || item.subject || 'N/A'}</Text>
            <Text variant="bodyMedium"><Text style={styles.label}>Message:</Text> {item.custom_message || 'No message available.'}</Text>
            <Text variant="bodyMedium"><Text style={styles.label}>Event Type:</Text> {item.event_type}</Text>
            <Text variant="bodyMedium"><Text style={styles.label}>Name:</Text> {item.name}</Text>
            <Text variant="bodyMedium"><Text style={styles.label}>Service:</Text> {item.service_name}</Text>

            <Button mode="outlined" style={styles.modalClose} onPress={hideModal}>
              Close
            </Button>
          </Surface>
        </Modal>
      </Portal>

      {/* Reminder Modal */}
      <Portal>
        <Modal
          visible={reminderModalVisible}
          onDismiss={() => setReminderModalVisible(false)}
          contentContainerStyle={[styles.modalContent, { backgroundColor: theme.colors.background }]}
        >
          <Surface style={styles.modalSurface} elevation={0}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              {hasReminder ? 'Update Reminder' : 'Add Reminder'}
            </Text>

            <Text variant="bodyMedium" style={styles.reminderEventTitle}>
              📅 {item.title}
            </Text>

            <TextInput
              label="Reminder Note (Optional)"
              value={reminderNote}
              onChangeText={setReminderNote}
              multiline
              numberOfLines={3}
              style={styles.reminderInput}
              placeholder="Add a custom note for this reminder..."
            />

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setReminderModalVisible(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveReminder}
                loading={loading}
                disabled={loading}
              >
                {hasReminder ? 'Update' : 'Add'} Reminder
              </Button>
            </View>
          </Surface>
        </Modal>
      </Portal>
    </>
  );
};

export default React.memo(AgendaItem);

const styles = StyleSheet.create({
  item: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  itemTitleText: {
    marginLeft: 16,
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
  },
  itemButtonContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emptyItem: {
    paddingLeft: 20,
    height: 52,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  emptyItemText: {
    fontSize: 14,
  },
  modalContent: {
    margin: 20,
    borderRadius: 8,
    padding: 20,
  },
  modalSurface: {
    padding: 10,
    borderRadius: 8,
  },
  modalTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  label: {
    fontWeight: '600',
  },
  modalClose: {
    marginTop: 15,
  },
  reminderEventTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  reminderInput: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
});
