import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  TouchableOpacity,
  Text as RNText
} from 'react-native';
import {
  ExpandableCalendar,
  AgendaList,
  CalendarProvider,
  WeekCalendar
} from 'react-native-calendars';
import { Text, useTheme,TouchableRipple,IconButton} from 'react-native-paper';
import { useFocusEffect,useRouter } from 'expo-router';

import ScreenLayout from '../../components/ScreenLayout';
import { useLocation } from '../../context/LocationContext';
import {
  getMarkedDatesFromDb,
  getAgendaItemsFromDb,
  fmt
} from '../../utils/eventsData';
import AgendaItem from '../../components/calender/AgendaItem';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Constants from 'expo-constants';
const CALENDAR_MONTHS_AHEAD = Number(Constants.expoConfig?.extra?.CALENDAR_MONTHS_AHEAD) || 3;

const CHEVRON = require('../../assets/img/next.png');

export default function CalendarScreen({ weekView = false }: { weekView?: boolean }) {
  const router = useRouter();
  const theme = useTheme();
  const { location, lastSyncAt } = useLocation();

  const today = useMemo(() => new Date(), []);
  const todayStr = fmt(today);

  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [sections, setSections] = useState<Array<{ title: string; data: any[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [monthsAhead, setMonthsAhead] = useState(CALENDAR_MONTHS_AHEAD);

  const { after, before, minDate, maxDate } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 0);
    return {
      after: fmt(start),
      before: fmt(end),
      minDate: fmt(start),
      maxDate: fmt(end),
    };
  }, [monthsAhead]);

  const calendarKey = useMemo(() => `calendar-${theme.dark ? 'dark' : 'light'}`, [theme.dark]);

  const calendarRef = useRef<{ toggleCalendarPosition: () => boolean }>(null);
  const rotation = useRef(new Animated.Value(0)).current;

  const toggleCalendarExpansion = useCallback(() => {
    const isOpen = calendarRef.current?.toggleCalendarPosition();
    Animated.timing(rotation, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [rotation]);

  const renderHeader = useCallback(
  (date) => {
    const rotateChevron = rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '-180deg'],
    });

    return (
      <TouchableOpacity style={styles.header} onPress={toggleCalendarExpansion}>
        <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          {date?.toString('MMMM yyyy')}
        </Text>
        <Animated.Image
          source={CHEVRON}
          style={{ transform: [{ rotate: '90deg' }, { rotate: rotateChevron }] }}
        />
      </TouchableOpacity>
    );
  },
  [toggleCalendarExpansion, rotation, theme.colors.onSurface]
);


  const loadFromDb = useCallback(async () => {
    if (!location?.place_id) {
      setMarkedDates({});
      setSections([]);
      return;
    }
    setLoading(true);
    try {
      const [md, items] = await Promise.all([
        getMarkedDatesFromDb(location.place_id, after, before),
        getAgendaItemsFromDb(location.place_id, after, before),
      ]);
      setMarkedDates(md);
      setSections(items);
    } catch (err) {
      console.error('[Calendar] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [location?.place_id, after, before]);

  // 🔁 Reload when location or sync time changes
  useEffect(() => {
    if (location?.place_id) {
      loadFromDb();
    }
  }, [location?.place_id, lastSyncAt, after, before]);

  // 🔁 Reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (location?.place_id) {
        loadFromDb();
      }
    }, [location?.place_id, after, before])
  );

  const renderItem = useCallback(({ item }: any) => <AgendaItem key={item.id} item={item} />, []);

  // Show loading only if no data loaded yet
  if (loading && sections.length === 0) {
    return (
      <ScreenLayout title="Event Calendar" subtitle="Loading..." scrollable={false}>
        <Text style={{ padding: 16 }}>Loading events...</Text>
      </ScreenLayout>
    );
  }

  return (
    <CalendarProvider date={todayStr} showTodayButton>
      <ScreenLayout
        title="Event Calendar"
        subtitle="View upcoming eco events"
        scrollable={false}
        contentStyle={{ paddingHorizontal: 1, paddingVertical: 0 }}
      >
      {location?.title && (
        <View style={styles.locationRow}>
          <View style={[styles.rowContent, { backgroundColor: theme.colors.elevation?.level1 || theme.colors.surface }]}>
            <MaterialCommunityIcons name="map-marker" size={22} color={theme.colors.primary} />
            <Text
              variant="titleSmall"
              style={[styles.locationText, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {location.title}
            </Text>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => router.push('/')}
              iconColor={theme.colors.primary}
              accessibilityLabel="Change Location"
            />
          </View>
        </View>
      )}


        {weekView ? (
          <WeekCalendar markedDates={markedDates} firstDay={1} />
        ) : (
          <ExpandableCalendar
            key={calendarKey}
            ref={calendarRef}
            renderHeader={renderHeader}
            onCalendarToggled={(isOpen) => rotation.setValue(isOpen ? 1 : 0)}
            markingType="multi-dot"
            markedDates={markedDates}
            minDate={minDate}
            maxDate={maxDate}
            disableAllTouchEventsForDisabledDays
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
        )}

        <AgendaList
          sections={sections}
          renderItem={renderItem}
          sectionStyle={{
            backgroundColor: theme.colors.elevation?.level1 || theme.colors.surface,
            padding: 4,
          }}
        />
      </ScreenLayout>
    </CalendarProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 6,
  },
  locationRow: {
    overflow: 'hidden',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
  },
});
