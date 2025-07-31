// services/LocationService.ts
import {
  fromLocationItem,
  upsertAddress,
  getAddressByPlaceId,
  type LocationItem as LIFromRepo,
} from '../lib/addressRepo';
import { getSelectedPlaceId, setSelectedPlaceId } from '../lib/settingsRepo';
import { migrate } from '../lib/db';
import { debugDumpSettings, debugWriteAndReadBack,debugDumpAddresses,debugFindDuplicatePlaceIds } from '../lib/settingsRepo';


export type LocationItem = {
  area_name: string;
  parcel_id: number;
  place_id: string;
  name: string;
  service_id: number;
  area_id: number;
  type: string;
  id?: string;    // MUST equal place_id for the dropdown
  title?: string; // display label
};

/**
 * Normalize DB row -> the SAME shape as suggestion items:
 * - id === place_id (string)
 * - title === name (string)
 * - include all fields you used during selection
 */
function toSuggestionShape(a: LIFromRepo): LocationItem {
  const placeId = a.place_id ?? '';
  const name    = (a.name ?? a.title ?? '') as string;
  return {
    // original API fields used by your UI
    area_name: (a.area_name ?? '') as string,
    parcel_id: (a.parcel_id ?? 0) as number,
    place_id: placeId,
    name,
    service_id: (a.service_id ?? 0) as number,
    area_id: (a.area_id ?? 0) as number,
    type: (a.type ?? '') as string,

    // fields needed by AutocompleteDropdown
    id: placeId,
    title: (a.title ?? name) as string,
  };
}

export const LocationService = {
  /** On select: upsert by place_id, remember place_id, return hydrated item in suggestion shape */
  async setLocation(loc: LocationItem): Promise<LocationItem> {
    await migrate();
    const placeId = loc.place_id || loc.id;
    if (!placeId) throw new Error('Selected location has no place_id');

    await upsertAddress(fromLocationItem(loc));
    await setSelectedPlaceId(placeId);

    const addr = await getAddressByPlaceId(placeId);
    if (!addr) throw new Error('Address not found after upsert');

    return toSuggestionShape(addr); // <- return same shape as the suggestion
  },

  /** On app load: read selectedPlaceId and return hydrated item in suggestion shape */
  async getLocation(): Promise<LocationItem | null> {
        // Debug: immediate read-back
    await migrate();
    const placeId = await getSelectedPlaceId();
    
    if (!placeId) return null;
    const addr = await getAddressByPlaceId(placeId);
    return addr ? toSuggestionShape(addr) : null;
  },

  async clearLocation() {
    await migrate();
    await setSelectedPlaceId(null);
  },

  /** Suggestions; ensure id === place_id and title === name */
  async fetchSuggestions(q: string): Promise<LocationItem[]> {
    if (!q || q.length < 3) return [];
    try {
      const res = await fetch(
        `https://api.recollect.net/api/areas/RegionOfWaterlooON/services/1110/address-suggest?q=${encodeURIComponent(
          q
        )}`
      );
      const data = await res.json();
      // Make the suggestion shape explicit and consistent with our hydrated result
      return data.map((item: any) => ({
        area_name: item.area_name,
        parcel_id: item.parcel_id,
        place_id: item.place_id,
        name: item.name,
        service_id: item.service_id,
        area_id: item.area_id,
        type: item.type,
        id: item.place_id,       // dropdown key
        title: item.name,        // dropdown label
      })) as LocationItem[];
    } catch (e) {
      console.error('Error fetching suggestions', e);
      return [];
    }
  },
};
