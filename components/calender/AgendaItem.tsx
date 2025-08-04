import isEmpty from 'lodash/isEmpty';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Button, Portal, Modal, Surface, useTheme } from 'react-native-paper';
import testIDs from '../../utils/testIDs';

interface ItemProps {
  item: any;
}

const AgendaItem = ({ item }: ItemProps) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

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
        </View>
      </TouchableOpacity>

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
  },
  label: {
    fontWeight: '600',
  },
  modalClose: {
    marginTop: 20,
    alignSelf: 'flex-end',
  },
});
