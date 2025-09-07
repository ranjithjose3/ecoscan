// context/LocationContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { LocationItem, LocationService } from '../services/LocationService';
import { syncEventsForPlaceFlexible } from '../services/EventsService';

import Constants from 'expo-constants';
const AUTO_SYNC_MONTHS_AHEAD = Number(Constants.expoConfig?.extra?.AUTO_SYNC_MONTHS_AHEAD) || 4;



type SyncOptions = {
  startDate?: string | Date;
  endDate?: string | Date;
  monthsAhead?: number;
  padBeforeDays?: number;
  padAfterDays?: number;
  locale?: string;
};

type LocationCtx = {
  location: LocationItem | null;
  setLocation: (loc: LocationItem | null) => void;
  syncEvents: (opts?: SyncOptions) => Promise<{ saved: number; total: number; after: string; before: string } | null>;
  syncing: boolean;
  /** Bumps after each successful sync; consumers can watch this to reload data. */
  lastSyncAt: number;
};

const LocationContext = createContext<LocationCtx>({
  location: null,
  setLocation: () => {},
  syncEvents: async () => null,
  syncing: false,
  lastSyncAt: 0,
});

type ProviderProps = {
  children: React.ReactNode;
  initialLocation?: LocationItem | null;
};

export const LocationProvider = ({ children, initialLocation }: ProviderProps) => {
  const [location, setLocationState] = useState<LocationItem | null>(initialLocation ?? null);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const syncingKeyRef = useRef<string | null>(null);

  // Only self-load if initialLocation was not provided by RootLayout
  useEffect(() => {
    if (initialLocation !== undefined) return;
    (async () => {
      const saved = await LocationService.getLocation();
      setLocationState(saved);
    })().catch(console.error);
  }, [initialLocation]);

  /** Internal helper to run a sync safely with de-dupe and error handling */
  const runSync = async (
    placeId: string,
    opts: SyncOptions = {}
  ): Promise<{ saved: number; total: number; after: string; before: string }> => {
    const key = JSON.stringify({ placeId, ...opts });
    if (syncing && syncingKeyRef.current === key) {
      // Same sync already in progress, ignore duplicate
      console.log('[LocationContext] Duplicate sync request ignored for', key);
      return { saved: 0, total: 0, after: 'n/a', before: 'n/a' } as any;
    }

    try {
      setSyncing(true);
      syncingKeyRef.current = key;

      const {
        startDate,
        endDate,
        monthsAhead = AUTO_SYNC_MONTHS_AHEAD,
        padBeforeDays = 0,
        padAfterDays = 0,
        locale = 'en',
      } = opts;

      const result = await syncEventsForPlaceFlexible({
        placeId,
        startDate,
        endDate,
        monthsAhead,
        padBeforeDays,
        padAfterDays,
        locale,
      });

      console.log(`Events synced ${result.after}..${result.before}: saved ${result.saved}/${result.total}`);

      // 🔔 Signal to listeners that new data is available
      setLastSyncAt(Date.now());

      return result;
    } finally {
      setSyncing(false);
      syncingKeyRef.current = null;
    }
  };

  /** Public method: manually trigger a sync for the current location */
  const syncEvents: LocationCtx['syncEvents'] = async (opts) => {
    if (!location?.place_id) {
      console.warn('syncEvents called but no location is selected.');
      return null;
    }
    try {
      return await runSync(location.place_id, opts);
    } catch (e) {
      console.warn('Event sync failed:', e);
      return null;
    }
  };

  // Save on select → rehydrate from DB so state is canonical, then auto-sync
  const setLocation = (loc: LocationItem | null) => {
    (async () => {
      // Ignore if selecting the same place again
      if (loc?.id && loc.id === location?.id) {
        setLocationState(prev => (prev && loc ? { ...prev, title: loc.title ?? prev.title } : prev));
        return;
      }

      if (loc) {
        const hydrated = await LocationService.setLocation(loc);
        setLocationState(hydrated);

        // Auto-sync default window after selection
        try {
          await runSync(hydrated.place_id, {
            monthsAhead: AUTO_SYNC_MONTHS_AHEAD,
            padBeforeDays: 0,
            padAfterDays: 0,
          });
        } catch (e) {
          console.warn('Auto event sync failed:', e);
        }
      } else {
        await LocationService.clearLocation();
        setLocationState(null);
      }
    })().catch(console.error);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, syncEvents, syncing, lastSyncAt }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
