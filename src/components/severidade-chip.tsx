import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { severidadeColors, severidadeLabel } from '@/lib/format';

export function SeveridadeChip({ severidade }: { severidade: string }) {
  const theme = useTheme();
  const { color, background } = severidadeColors(severidade);

  return (
    <View style={[styles.chip, { backgroundColor: theme[background] }]}>
      <Icon name="warning" size={13} color={theme[color]} />
      <ThemedText type="caption" style={[styles.text, { color: theme[color] }]}>
        {severidadeLabel(severidade)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
  },
  text: {
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
