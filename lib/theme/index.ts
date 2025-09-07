// lib/theme.ts
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { adaptNavigationTheme } from 'react-native-paper';
import merge from 'deepmerge';

/** Add bright brand + danger tokens */
declare module 'react-native-paper' {
  interface MD3Colors {
    brandContainer: string;
    onBrandContainer: string;
    subtleBg: string;
    cardBorder: string;
    danger: string;
    dangerContainer: string;
    onDangerContainer: string;
  }
}

/* ---------- BRIGHT LIGHT THEME ---------- */
const baseLight = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,

    // Vibrant greens
    primary: '#1FA64B',              // vivid brand green
    onPrimary: '#FFFFFF',
    primaryContainer: '#BFF5CC',     // bright mint
    onPrimaryContainer: '#063B1C',

    secondary: '#00C853',            // emerald accent
    onSecondary: '#FFFFFF',
    secondaryContainer: '#C9F3D4',
    onSecondaryContainer: '#063A18',

    // Surfaces
    background: '#FDFEFE',
    surface: '#FFFFFF',
    onSurface: '#101310',
    onSurfaceVariant: '#3C4A3C',
    outline: '#B7D3B7',
    outlineVariant: '#E6F3E6',

    // Custom (brighter)
    brandContainer: '#D8FFE2',       // brighter chip/bg container
    onBrandContainer: '#083D1D',
    subtleBg: '#F4FFF6',
    cardBorder: '#CFEFD7',

    // Destructive (clean, high-contrast)
    danger: '#D32F2F',
    dangerContainer: '#FFD9D9',
    onDangerContainer: '#5C1515',
  },
};

/* ---------- BRIGHT DARK THEME ---------- */
const baseDark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,

    primary: '#2EE66C',              // neon-ish but readable
    onPrimary: '#08150B',
    primaryContainer: '#145C2B',
    onPrimaryContainer: '#BFF5CC',

    secondary: '#00C853',
    onSecondary: '#0A170D',
    secondaryContainer: '#245F34',
    onSecondaryContainer: '#D7F7DE',

    background: '#0B0F0C',
    surface: '#111712',
    onSurface: '#E7F7EB',
    onSurfaceVariant: '#C1D7C5',
    outline: '#557C55',
    outlineVariant: '#203120',

    brandContainer: '#1C5A2D',
    onBrandContainer: '#D6FFE0',
    subtleBg: '#0E1A12',
    cardBorder: '#294A2F',

    danger: '#FF9DA0',
    dangerContainer: '#8C1D18',
    onDangerContainer: '#FFDAD6',
  },
};

const { LightTheme: PaperNavLight, DarkTheme: PaperNavDark } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

/** Export merged themes */
export const CombinedLightTheme = merge(PaperNavLight, baseLight);
export const CombinedDarkTheme = merge(PaperNavDark, baseDark);
