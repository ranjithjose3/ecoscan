import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { AutocompleteDropdown } from 'react-native-autocomplete-dropdown';
import { useTheme, Text } from 'react-native-paper';
import { LocationService, LocationItem } from '../services/LocationService';
import { useLocation } from '../context/LocationContext';

type Props = { onSelect?: (item: LocationItem | null) => void };

export default function LocationPicker({ onSelect }: Props) {
  const theme = useTheme();
  const { location, setLocation } = useLocation();

  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const dropdownController = useRef<any>(null);

  // Prevent accidental clears when we programmatically set the dropdown item/text.
  const suppressNullSelectRef = useRef(false);

  const fetchSuggestions = async (q: string) => {
    setQuery(q);
    if (typeof q !== 'string' || q.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const data = await LocationService.fetchSuggestions(q);
    setSuggestions(data);
    setLoading(false);
  };

  const handleSelect = (item: LocationItem | null) => {
    // AutocompleteDropdown sometimes sends null during text changes or programmatic sets.
    if (item == null) {
      if (suppressNullSelectRef.current) {
        // Ignore the one null caused by our own setItem/setInputText calls.
        suppressNullSelectRef.current = false;
        return;
      }
      // Ignore other nulls to avoid clearing persisted selection.
      return;
    }

    // Resolve full suggestion (onSelectItem may pass only {id,title})
    const full = suggestions.find(s => s.id === item.id) ?? item;

    setLocation(full);     // persists selectedPlaceId, re-hydrates canonical value
    onSelect?.(full);
  };

  // When the saved location loads or changes, push it into the dropdown UI.
  useEffect(() => {
    const ctl = dropdownController.current;
    if (!ctl) return;

    suppressNullSelectRef.current = true; // next null from dropdown should be ignored

    if (location?.id) {
      const title = location.title ?? location.name ?? '';
      ctl.setItem?.({ id: location.id, title });
      ctl.setInputText?.(title);
    } else {
      ctl.clear?.();
      ctl.setInputText?.('');
    }
  }, [location?.id]);

  return (
    <View style={styles.container}>
      <AutocompleteDropdown
        ref={dropdownController}
        controller={(c) => (dropdownController.current = c)}
        dataSet={suggestions}
        onChangeText={fetchSuggestions}
        onSelectItem={handleSelect}
        initialValue={location?.id}  // only at mount; effect keeps it synced
        useFilter={false}
        debounce={400}
        loading={loading}
        direction={Platform.select({ ios: 'down', android: 'down' })}
        suggestionsListMaxHeight={Dimensions.get('window').height * 0.4}
        textInputProps={{
          placeholder: 'Search for your location...',
          autoCorrect: false,
          autoCapitalize: 'none',
          style: {
            color: theme.colors.onSurface,
            backgroundColor: theme.colors.surface,
            paddingLeft: 18,
            height: 50,
            borderRadius: 25,
          },
        }}
        inputContainerStyle={{
          backgroundColor: theme.colors.surface,
          borderRadius: 25,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        }}
        suggestionsListContainerStyle={{
          backgroundColor: theme.colors.surface,
        }}
        containerStyle={{ flexGrow: 1, flexShrink: 1 }}
        renderItem={(item) => (
          <Text style={{ padding: 10, color: theme.colors.onSurface }}>
            {item.title}
          </Text>
        )}
        inputHeight={50}
        showChevron
        closeOnBlur={false}
        showClear={false}
        EmptyResultComponent={() =>
          query.length < 3 ? (
            <Text style={{ padding: 10, fontStyle: 'italic', color: theme.colors.outline }}>
              🔎 Type at least 3 characters to search locations…
            </Text>
          ) : (
            <Text style={{ padding: 10, fontStyle: 'italic', color: theme.colors.outline }}>
              🚫 No locations found
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
});
