import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import {
  CalendarProvider,
  ExpandableCalendar,
  AgendaList
} from 'react-native-calendars';
import { getAgendaItems, getMarkedDates } from '../../utils/mockData';
import ScreenLayout from '../../components/ScreenLayout';
import { useLocation } from '../../context/LocationContext';

export default function CalendarScreen() {
  const theme = useTheme();
  const { location } = useLocation();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const markedDates = useMemo(() => getMarkedDates(), []);
  const agendaItems = useMemo(() => getAgendaItems(), []);

  const renderItem = ({ item }: any) => {
    if (!item?.title) return null;
    return (
      <View style={{ padding: 2 }}>
        <Text>{item.hour} - {item.title}</Text>
      </View>
    );
  };

  return (
    <CalendarProvider date={today} showTodayButton>
      <ScreenLayout
        title="Event Calendar"
        subtitle="View upcoming eco events"
        scrollable={false}
        contentStyle={{ paddingHorizontal: 1 , paddingVertical:0}}
      >
       {location?.title && (
          <View style={{ paddingTop: 8, paddingHorizontal: 8, paddingBottom: 4 }}>
            <Text
              style={[
                theme.fonts.titleMedium,
                { color: theme.colors.onSurface }
              ]}
            >
              📍 {location.title}
            </Text>
          </View>
        )}
        
        <ExpandableCalendar
          key={`calendar-${theme.dark ? 'dark' : 'light'}`}
          initialPosition="closed"
          markingType="multi-dot"
          markedDates={markedDates}
          theme={{
            calendarBackground: theme.colors.surface,
            todayTextColor: theme.colors.primary,
            selectedDayBackgroundColor: theme.colors.primary,
            arrowColor: theme.colors.primary,
            monthTextColor: theme.colors.onSurface,
            textSectionTitleColor: theme.colors.secondary || '#888',
            dayTextColor: theme.colors.onSurface,
            todayButtonTextColor: theme.colors.onPrimary,
            'stylesheet.expandable.main': {
              todayButton: {
                backgroundColor: theme.colors.primary,
                borderRadius: 6,
                paddingHorizontal: 12,
                paddingVertical: 6,
                alignSelf: 'center',
              },
              todayButtonText: {
                color: theme.colors.onPrimary,
                fontWeight: 'bold',
                fontSize: 14,
              },
            },
          }}
        />
        <AgendaList
          sections={agendaItems}
          renderItem={renderItem}
          sectionStyle={{
            backgroundColor:
              theme.colors.elevation?.level1 || theme.colors.surface,
            padding: 0,
          }}
        />
      </ScreenLayout>
    </CalendarProvider>
  );
}
