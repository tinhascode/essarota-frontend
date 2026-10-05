import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PlaceFieldProps = {
  kind: 'origem' | 'destino';
  value: string;
  placeholder: string;
  active: boolean;
  loading?: boolean;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onClear: () => void;
};

export function PlaceField({
  kind,
  value,
  placeholder,
  active,
  loading = false,
  onChangeText,
  onFocus,
  onClear,
}: PlaceFieldProps) {
  const theme = useTheme();
  const markerColor = kind === 'origem' ? theme.accent : theme.primary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: active ? markerColor : theme.border,
        },
      ]}>
      {kind === 'origem' ? (
        <View style={[styles.originDot, { borderColor: markerColor }]} />
      ) : (
        <Icon name="pin" size={20} color={markerColor} />
      )}
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.primaryText}
        onChangeText={onChangeText}
        onFocus={onFocus}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel={placeholder}
        style={[styles.input, { color: theme.text }]}
      />
      {loading ? (
        <ActivityIndicator size="small" color={theme.textSecondary} />
      ) : value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar endereço"
          hitSlop={10}
          onPress={onClear}>
          <Icon name="close" size={18} color={theme.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 50,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  originDot: {
    width: 16,
    height: 16,
    marginHorizontal: 2,
    borderRadius: 8,
    borderWidth: 4,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontSize: 16,
    fontFamily: Fonts.sans,
    outlineWidth: 0,
  },
});
