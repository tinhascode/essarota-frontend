import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tipoIcon } from '@/lib/format';
import type { LinhaResponse } from '@/types/api';

type LinhaPickerProps = {
  linhas: LinhaResponse[];
  value: string | null;
  onChange: (linhaId: string | null) => void;
  /** Shows a leading chip that maps to `null` (e.g. "Todas"). */
  allLabel?: string;
  label?: string;
  error?: string;
  wrap?: boolean;
};

export function LinhaPicker({ linhas, value, onChange, allLabel, label, error, wrap = false }: LinhaPickerProps) {
  const theme = useTheme();

  const chips = (
    <>
      {allLabel && (
        <Chip label={allLabel} selected={value === null} onPress={() => onChange(null)} />
      )}
      {linhas.map((linha) => (
        <Chip
          key={linha.id}
          label={linha.nome}
          tipo={linha.tipo}
          selected={value === linha.id}
          onPress={() => onChange(linha.id)}
        />
      ))}
    </>
  );

  return (
    <View style={styles.wrapper}>
      {label && (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      )}
      {wrap ? (
        <View style={styles.wrap}>{chips}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {chips}
        </ScrollView>
      )}
      {error && (
        <ThemedText type="caption" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

function Chip({
  label,
  tipo,
  selected,
  onPress,
}: {
  label: string;
  tipo?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = selected ? theme.onPrimary : theme.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundElement,
          borderColor: selected ? theme.primary : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      {tipo && <Icon name={tipoIcon(tipo)} size={14} color={selected ? theme.onPrimary : theme.primaryText} />}
      <ThemedText type="smallBold" numberOfLines={1} style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one,
  },
  row: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 36,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    maxWidth: 240,
  },
  pressed: {
    opacity: 0.8,
  },
});
