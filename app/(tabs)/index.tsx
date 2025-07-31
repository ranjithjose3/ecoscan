// app/(tabs)/index.tsx
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, SegmentedButtons, useTheme, Divider } from 'react-native-paper';
import ScreenLayout from '../../components/ScreenLayout';
import { ThemeModeContext } from '../_layout';
import LocationPicker from '../../components/LocationPicker';
import type { ThemeMode } from '../../lib/settingsRepo';
import { useLocation } from '../../context/LocationContext';


export default function IndexScreen() {
  const theme = useTheme();
  const { mode, setMode } = useContext(ThemeModeContext);
  const { location } = useLocation();


  return (
    <ScreenLayout title="Ecoscan" subtitle="Profile / Settings">
      <Text
        style={[
          theme.fonts.bodyMedium,
          styles.text,
          { color: theme.colors.onSurface },
        ]}
      >
        Welcome to Ecoscan! Your eco-friendly assistant.
      </Text>

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

      <Text style={[theme.fonts.labelLarge, { marginBottom: 8 }]}>
        Your Location
      </Text>

      <LocationPicker />

      <Divider style={{ marginVertical: 20 }} />

      <View style={styles.buttonWrapper}>
        <Button
          mode="contained"
          onPress={() =>
            alert(`Selected location: ${location?.title || 'None'}`)
          }
        >
          Save
        </Button>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  text: { marginBottom: 16 },
  buttonWrapper: { alignItems: 'center' },
});
