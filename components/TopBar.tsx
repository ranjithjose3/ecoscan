import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.dark
            ? 'rgba(255,255,255,0.2)'
            : 'rgba(0,0,0,0.1)',
        },
      ]}
    >
      <Text
        style={[
          theme.fonts.titleMedium,
          { color: theme.colors.primary, marginBottom: subtitle ? 2 : 0 },
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={[
            theme.fonts.bodySmall,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
});
