import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GeoPlace } from '@/services/geocoding';

type PlaceSuggestionsProps = {
  results: GeoPlace[];
  loading: boolean;
  error: string | null;
  onSelect: (place: GeoPlace) => void;
};

export function PlaceSuggestions({ results, loading, error, onSelect }: PlaceSuggestionsProps) {
  const theme = useTheme();

  if (error) {
    return (
      <ThemedText type="small" themeColor="danger" style={styles.message}>
        {error}
      </ThemedText>
    );
  }

  if (results.length === 0) {
    return loading ? (
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        Buscando endereços…
      </ThemedText>
    ) : (
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        Nenhum endereço encontrado. Tente ser mais específico ou toque no mapa.
      </ThemedText>
    );
  }

  return (
    <View style={[styles.list, { borderColor: theme.border }]}>
      {results.map((place, index) => (
        <Pressable
          key={`${place.latitude},${place.longitude},${index}`}
          accessibilityRole="button"
          onPress={() => onSelect(place)}
          style={({ pressed }) => [
            styles.item,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
            pressed && { backgroundColor: theme.backgroundSelected },
          ]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
            <Icon name="pin" size={16} color={theme.primaryText} />
          </View>
          <View style={styles.texts}>
            <ThemedText type="smallBold" numberOfLines={1}>
              {place.label}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
              {place.secondary}
            </ThemedText>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  message: {
    paddingVertical: Spacing.two,
  },
});
