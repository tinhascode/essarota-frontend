import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tipoIcon, tipoLabel } from '@/lib/format';
import type { LinhaResponse } from '@/types/api';

type LinhaBadgeProps = {
  linha: Pick<LinhaResponse, 'nome' | 'tipo'> | null | undefined;
  showTipo?: boolean;
};

export function LinhaIcon({ tipo, size = 40 }: { tipo: string; size?: number }) {
  const theme = useTheme();
  const isBus = tipo === 'ONIBUS';
  return (
    <View
      style={[
        styles.icon,
        {
          width: size,
          height: size,
          borderRadius: size / 2.8,
          backgroundColor: isBus ? theme.accentSoft : theme.primarySoft,
        },
      ]}>
      <Icon name={tipoIcon(tipo)} size={size * 0.5} color={isBus ? theme.accentText : theme.primaryText} />
    </View>
  );
}

export function LinhaBadge({ linha, showTipo = false }: LinhaBadgeProps) {
  const theme = useTheme();
  const tipo = linha?.tipo ?? '';
  const isBus = tipo === 'ONIBUS';
  const color = isBus ? theme.accentText : theme.primaryText;

  return (
    <View style={[styles.badge, { backgroundColor: isBus ? theme.accentSoft : theme.primarySoft }]}>
      <Icon name={tipoIcon(tipo)} size={14} color={color} />
      <ThemedText type="caption" numberOfLines={1} style={[styles.text, { color }]}>
        {linha ? (showTipo ? `${tipoLabel(linha.tipo)} · ${linha.nome}` : linha.nome) : 'Linha removida'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    maxWidth: '100%',
  },
  text: {
    fontWeight: 700,
    flexShrink: 1,
  },
});
