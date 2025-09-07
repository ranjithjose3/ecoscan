// app/_layout.tsx
import React, { useEffect, useState, createContext } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { adaptNavigationTheme } from 'react-native-paper';
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';

import merge from 'deepmerge';
import { AutocompleteDropdownContextProvider } from 'react-native-autocomplete-dropdown';
import { LocationProvider } from '../context/LocationContext';
import CustomSplash from '../components/SplashScreen';

import { migrate } from '../lib/db';
import { getThemeMode, setThemeMode as saveThemeMode, type ThemeMode } from '../lib/settingsRepo';
import { LocationService, type LocationItem } from '../services/LocationService';
import { CombinedLightTheme, CombinedDarkTheme } from '../lib/theme';


SplashScreen.preventAutoHideAsync();

export const ThemeModeContext = createContext({
  mode: 'system' as ThemeMode,
  setMode: (_m: ThemeMode) => {},
});


export default function RootLayout() {
  const systemScheme = useSystemColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [showSplash, setShowSplash] = useState(true);
  const [initialLocation, setInitialLocation] = useState<LocationItem | null | undefined>(undefined);

  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const activeTheme =
    mode === 'system'
      ? systemScheme === 'dark'
        ? CombinedDarkTheme
        : CombinedLightTheme
      : mode === 'dark'
      ? CombinedDarkTheme
      : CombinedLightTheme;

  useEffect(() => {
    (async () => {
      await migrate();                         // 1) ensure DB / tables
      const savedTheme = await getThemeMode(); // 2) theme
      if (savedTheme) setModeState(savedTheme);

      // 3) pre-load the saved location in the SAME shape used by the dropdown
      const savedLocation = await LocationService.getLocation();
      setInitialLocation(savedLocation);       // will be passed to LocationProvider
    })().catch(console.error);
  }, []);

  const setMode = async (m: ThemeMode) => {
    setModeState(m);
    await saveThemeMode(m);
  };

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && initialLocation !== undefined) {
      const timer = setTimeout(async () => {
        await SplashScreen.hideAsync();
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loaded, initialLocation]);

  // Wait until fonts AND initialLocation are ready (undefined = not resolved yet)
  if (!loaded || showSplash || initialLocation === undefined) {
    return <CustomSplash />;
  }

  return (
    <ThemeModeContext.Provider value={{ mode, setMode }}>
      <PaperProvider theme={activeTheme}>
        <AutocompleteDropdownContextProvider>
          {/* Pass the preloaded location here */}
          <LocationProvider initialLocation={initialLocation}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </LocationProvider>
        </AutocompleteDropdownContextProvider>
      </PaperProvider>
    </ThemeModeContext.Provider>
  );
}
