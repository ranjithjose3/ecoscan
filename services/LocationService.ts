// services/LocationService.ts
import {
  fromLocationItem,
  upsertAddress,
  getAddressByPlaceId,
  type LocationItem as LIFromRepo,
} from '../lib/addressRepo';
import { getSelectedPlaceId, setSelectedPlaceId } from '../lib/settingsRepo';
import { migrate } from '../lib/db';
import Constants from 'expo-constants';
const AUTO_SYNC_MONTHS_AHEAD = Number(Constants.expoConfig?.extra?.AUTO_SYNC_MONTHS_AHEAD) || 4;


export type LocationItem = {
  area_name: string;
  parcel_id: number;
  place_id: string;
  name: string;
  service_id: number;
  area_id: number;
  type: string;
  id?: string;
  title?: string;
};

function toSuggestionShape(a: LIFromRepo): LocationItem {
  const placeId = a.place_id ?? '';
  const name = (a.name ?? a.title ?? '') as string;

  return {
    area_name: (a.area_name ?? '') as string,
    parcel_id: (a.parcel_id ?? 0) as number,
    place_id: placeId,
    name,
    service_id: (a.service_id ?? 0) as number,
    area_id: (a.area_id ?? 0) as number,
    type: (a.type ?? '') as string,
    id: placeId,
    title: (a.title ?? name) as string,
  };
}

export const LocationService = {
  async setLocation(loc: LocationItem): Promise<LocationItem> {
    await migrate();
    const placeId = loc.place_id || loc.id;
    if (!placeId) throw new Error('Selected location has no place_id');

    await upsertAddress(fromLocationItem(loc));
    await setSelectedPlaceId(placeId);

    const addr = await getAddressByPlaceId(placeId);
    if (!addr) throw new Error('Address not found after upsert');

    return toSuggestionShape(addr);
  },

  async getLocation(): Promise<LocationItem | null> {
    await migrate();
    const placeId = await getSelectedPlaceId();
    if (!placeId) return null;

    try {
      const addr = await getAddressByPlaceId(placeId);
      return addr ? toSuggestionShape(addr) : null;
    } catch (e) {
      console.warn('[LocationService] getLocation error', { placeId, error: e });
      return null;
    }
  },

  async clearLocation() {
    await migrate();
    await setSelectedPlaceId(null);
  },

  async fetchSuggestions(q: string): Promise<LocationItem[]> {
    if (!q || q.length < 3) return [];

    try {
      const res = await fetch(
        `https://api.recollect.net/api/areas/RegionOfWaterlooON/services/1110/address-suggest?q=${encodeURIComponent(
          q
        )}`
      );
      const data = await res.json();
      if (!Array.isArray(data)) return [];

      return data.map((item: any) => ({
        area_name: item.area_name,
        parcel_id: item.parcel_id,
        place_id: item.place_id,
        name: item.name,
        service_id: item.service_id,
        area_id: item.area_id,
        type: item.type,
        id: item.place_id,
        title: item.name,
      })) as LocationItem[];
    } catch (e) {
      console.error('[LocationService] fetchSuggestions error', e);
      return [];
    }
  },
};
