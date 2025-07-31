import React from 'react';
import { StyleSheet, ViewStyle, ScrollView } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from './TopBar';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
}

export default function ScreenLayout({
  children,
  style,
  contentStyle,
  title,
  subtitle,
  scrollable = true,
}: ScreenLayoutProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: theme.colors.background },
        style,
      ]}
      edges={['top', 'left', 'right']}
    >
      <Card
        style={[
          {
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderWidth: 0,
            margin: 0,
            borderRadius: 0,
            elevation: 0,
          },
        ]}
      >
        {title && <TopBar title={title} subtitle={subtitle} />}
        <Card.Content style={[{ paddingVertical: 5  }, contentStyle]}>
          {scrollable ? (
            <ScrollView
              contentContainerStyle={{ padding: 0 }}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </Card.Content>
      </Card>
    </SafeAreaView>
  );
}
