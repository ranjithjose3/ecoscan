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

import Constants from 'expo-constants';
const AUTO_SYNC_MONTHS_AHEAD = Number(Constants.expoConfig?.extra?.AUTO_SYNC_MONTHS_AHEAD) || 4;

export default function IndexScreen() {
  const theme = useTheme();
  const { mode, setMode } = useContext(ThemeModeContext);
  const { location, syncEvents, syncing } = useLocation();

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
