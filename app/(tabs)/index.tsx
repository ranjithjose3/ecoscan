// app/(tabs)/index.tsx
import React, { useContext, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Text,
  SegmentedButtons,
  useTheme,
  Divider,
} from 'react-native-paper';
import ScreenLayout from '../../components/ScreenLayout';
import { ThemeModeContext } from '../_layout';
import LocationPicker from '../../components/LocationPicker';
import type { ThemeMode } from '../../lib/settingsRepo';
import { useLocation } from '../../context/LocationContext';
import EventsList from '../../components/EventsList';

export default function IndexScreen() {
  const theme = useTheme();
  const { mode, setMode } = useContext(ThemeModeContext);
  const { location, syncEvents, syncing } = useLocation();

  // 👇 Controls how much the list shows (today → +N months)
  const [viewMonthsAhead, setViewMonthsAhead] = useState<number>(1);

  const handleSync1 = async () => {
    await syncEvents({ monthsAhead: 1 });
    setViewMonthsAhead(1);            // show 1 month after syncing 1 month
  };

  const handleSync4 = async () => {
    await syncEvents({ monthsAhead: 4 });
    setViewMonthsAhead(4);            // show 4 months after syncing 4 months
  };

  return (
    <ScreenLayout title="Ecoscan" subtitle="Profile / Settings" scrollable={false}>
      <Text
        style={[
          theme.fonts.bodyMedium,
          styles.text,
          { color: theme.colors.onSurface },
        ]}
      >
        Welcome to Ecoscan! Your eco-friendly assistant.
      </Text>

      {/* Theme */}
      <Text style={[theme.fonts.labelLarge, { marginBottom: 8 }]}>
        Theme Preference
      </Text>
      <SegmentedButtons
        value={mode}
        onValueChange={(val) => setMode(val as ThemeMode)}
        buttons={[
          { value: 'light', label: 'Light', icon: 'white-balance-sunny' },
          { value: 'dark', label: 'Dark', icon: 'weather-night' },
          { value: 'system', label: 'System', icon: 'theme-light-dark' },
        ]}
        style={{ marginBottom: 20 }}
      />

      {/* Location */}
      <Text style={[theme.fonts.labelLarge, { marginBottom: 8 }]}>
        Your Location
      </Text>
      <LocationPicker />
      <Text style={{ marginTop: 8, color: theme.colors.onSurface, opacity: 0.7 }}>
        Selected: {location?.title || 'None'}
      </Text>

      <Divider style={{ marginVertical: 16 }} />

      {/* Event sync + view controls */}
      <View style={styles.row}>
        <Button
          mode="contained-tonal"
          onPress={handleSync1}
          loading={syncing}
          disabled={syncing || !location?.place_id}
        >
          Sync next month
        </Button>
        <Button
          mode="outlined"
          onPress={handleSync4}
          loading={syncing}
          disabled={syncing || !location?.place_id}
        >
          Sync next 4 months
        </Button>

        {/* Optional quick view toggles without syncing again */}
        <Button
          mode="text"
          onPress={() => setViewMonthsAhead(1)}
          disabled={!location?.place_id}
        >
          View 1M
        </Button>
        <Button
          mode="text"
          onPress={() => setViewMonthsAhead(4)}
          disabled={!location?.place_id}
        >
          View 4M
        </Button>
      </View>

      <Text style={[theme.fonts.labelLarge, { marginTop: 16, marginBottom: 8 }]}>
        Events (from SQLite)
      </Text>
      {/* 👇 Show as many months as selected above */}
      <EventsList placeId={location?.place_id} monthsAhead={viewMonthsAhead} />

      <Divider style={{ marginVertical: 16 }} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  text: { marginBottom: 16 },
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
