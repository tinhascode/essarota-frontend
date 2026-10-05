import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { TrajetoResponse } from '@/types/api';

type TrajetoCardProps = {
  trajeto: TrajetoResponse;
  deleting?: boolean;
  onPress?: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function TrajetoCard({ trajeto, deleting = false, onPress, onEdit, onDelete }: TrajetoCardProps) {
  const theme = useTheme();

  return (
    <Card style={[styles.card, deleting && styles.deleting]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir trajeto ${trajeto.origem} para ${trajeto.destino}`}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.route, pressed && styles.pressed]}>
        <View style={styles.timeline}>
          <View style={[styles.originDot, { borderColor: theme.accent }]} />
          <View style={[styles.connector, { borderColor: theme.border }]} />
          <Icon name="pin" size={18} color={theme.primary} />
        </View>
        <View style={styles.places}>
          <View>
            <ThemedText type="caption" themeColor="textSecondary">
              Origem
            </ThemedText>
            <ThemedText type="smallBold" numberOfLines={2}>
              {trajeto.origem}
            </ThemedText>
          </View>
          <View>
            <ThemedText type="caption" themeColor="textSecondary">
              Destino
            </ThemedText>
            <ThemedText type="smallBold" numberOfLines={2}>
              {trajeto.destino}
            </ThemedText>
          </View>
        </View>
        {onPress && <Icon name="chevronRight" size={20} color={theme.textSecondary} style={styles.chevron} />}
      </Pressable>

      <View style={[styles.footer, { borderTopColor: theme.border }]}>
        <View style={[styles.timeChip, { backgroundColor: theme.primarySoft }]}>
          <Icon name="clock" size={14} color={theme.primaryText} />
          <ThemedText type="caption" themeColor="primaryText" style={styles.timeText}>
            ~{trajeto.tempoEstimadoMinutos} min
          </ThemedText>
        </View>
        <View style={styles.actions}>
          <IconButton icon="edit" size={36} accessibilityLabel="Editar trajeto" onPress={onEdit} />
          <IconButton
            icon="delete"
            size={36}
            color={theme.danger}
            accessibilityLabel="Excluir trajeto"
            onPress={onDelete}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  deleting: {
    opacity: 0.5,
  },
  route: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  chevron: {
    alignSelf: 'center',
  },
  timeline: {
    alignItems: 'center',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  originDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 4,
  },
  connector: {
    flex: 1,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginVertical: Spacing.one,
  },
  places: {
    flex: 1,
    gap: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
  },
  timeText: {
    fontWeight: 700,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
