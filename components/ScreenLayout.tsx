import React from 'react';
import { StyleSheet, ViewStyle, ScrollView, StyleProp } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from './TopBar';

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;         
  cardStyle?: StyleProp<ViewStyle>;     
  contentStyle?: StyleProp<ViewStyle>;
  title?: string;
  subtitle?: string;
  scrollable?: boolean;
  edges?: ('top' | 'right' | 'bottom' | 'left')[];
}

export default function ScreenLayout({
  children,
  style,
  cardStyle,
  contentStyle,
  title,
  subtitle,
  scrollable = true,
  edges = ['top', 'left', 'right'], 
}: ScreenLayoutProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}
      edges={edges}
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
          cardStyle, 
        ]}
      >
        {title && <TopBar title={title} subtitle={subtitle} />}

        <Card.Content style={[{ paddingVertical: 1 }, contentStyle]}>
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
