import { Pressable, StyleSheet, View } from 'react-native';

import { LinhaBadge } from '@/components/linha-badge';
import { SeveridadeChip } from '@/components/severidade-chip';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, severidadeColors } from '@/lib/format';
import type { AlertaResponse, LinhaResponse } from '@/types/api';

type AlertaCardProps = {
  alerta: AlertaResponse;
  linha: LinhaResponse | undefined;
  onPress?: () => void;
};

export function AlertaCard({ alerta, linha, onPress }: AlertaCardProps) {
  const theme = useTheme();
  const accent = theme[severidadeColors(alerta.severidade).color];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={[styles.card, { borderLeftColor: accent }]}>
        <View style={styles.top}>
          <SeveridadeChip severidade={alerta.severidade} />
          <ThemedText type="caption" themeColor="textSecondary">
            {formatDateTime(alerta.criadoEm)}
          </ThemedText>
        </View>
        <ThemedText type="default" numberOfLines={3}>
          {alerta.descricao}
        </ThemedText>
        <View style={styles.bottom}>
          <LinhaBadge linha={linha} showTipo />
          {onPress && <Icon name="chevronRight" size={18} color={theme.textSecondary} />}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 4,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.75,
  },
});
