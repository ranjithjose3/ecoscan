// context/LocationContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { LocationItem, LocationService } from '../services/LocationService';

type LocationCtx = {
  location: LocationItem | null;
  setLocation: (loc: LocationItem | null) => void;
};

const LocationContext = createContext<LocationCtx>({
  location: null,
  setLocation: () => {},
});

type ProviderProps = {
  children: React.ReactNode;
  /** If provided, we'll use this value at start and skip self-loading */
  initialLocation?: LocationItem | null;
};

export const LocationProvider = ({ children, initialLocation }: ProviderProps) => {
  const [location, setLocationState] = useState<LocationItem | null>(
    initialLocation ?? null
  );

  // Only self-load if no initialLocation was passed
  useEffect(() => {
    if (initialLocation !== undefined) return;
    (async () => {
      const saved = await LocationService.getLocation();
      setLocationState(saved);
    })().catch(console.error);
  }, [initialLocation]);

  // Save on select → rehydrate from DB so state is canonical
  const setLocation = (loc: LocationItem | null) => {
    (async () => {
      if (loc) {
        const hydrated = await LocationService.setLocation(loc);
        setLocationState(hydrated);
      } else {
        await LocationService.clearLocation();
        setLocationState(null);
      }
    })().catch(console.error);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
