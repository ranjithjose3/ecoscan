import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { adaptNavigationTheme } from 'react-native-paper';
import merge from 'deepmerge';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4C9A4E',
    secondary: '#8CC63E',
    background: '#F8F8F8',
    surface: '#FFFFFF',
    onSurface: '#2E2E2E',
    onSurfaceVariant: '#857D7D',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4CAF50',
    secondary: '#8BC34A',
  },
};

const { LightTheme: PaperNavLight, DarkTheme: PaperNavDark } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

export const CombinedLightTheme = merge(PaperNavLight, lightTheme);
export const CombinedDarkTheme = merge(PaperNavDark, darkTheme);
