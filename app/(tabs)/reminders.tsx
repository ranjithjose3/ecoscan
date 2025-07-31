import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import ScreenLayout from '../../components/ScreenLayout'; // ✅ Reusable layout

// ✅ Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function ReminderScreen() {
  const theme = useTheme();

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission for notifications not granted!');
      }
    })();
  }, []);

  const scheduleReminder = async () => {
    const trigger = new Date(Date.now() + 10 * 1000); // ✅ Fires after 10 sec
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Reminder 📌',
        body: 'This is your scheduled reminder (10 sec after now)!',
      },
      trigger,
    });
  };

  return (
    <ScreenLayout
      title="Reminders"
      subtitle="Manage your eco-task reminders"
      scrollable={false} // ✅ No scroll for single button UI
    >
      <Card.Content>
        <Text
          style={[
            theme.fonts.bodyMedium,
            styles.text,
            { color: theme.colors.onSurface },
          ]}
        >
          Schedule reminders for eco-tasks! Press the button below, and you’ll be
          notified after 10 seconds.
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button mode="contained" onPress={scheduleReminder}>
          Schedule Reminder (10 sec)
        </Button>
      </Card.Actions>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  text: { marginBottom: 10 },
});
