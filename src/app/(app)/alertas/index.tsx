import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { AlertaCard } from '@/components/alerta-card';
import { LinhaIcon } from '@/components/linha-badge';
import { LinhaPicker } from '@/components/linha-picker';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Icon } from '@/components/ui/icon';
import { Segmented } from '@/components/ui/segmented';
import { LoadingView } from '@/components/ui/state-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import { tipoLabel } from '@/lib/format';
import { listarAlertas } from '@/services/alertas';
import { listarLinhas } from '@/services/linhas';
import type { AlertaResponse, LinhaResponse } from '@/types/api';

type Aba = 'alertas' | 'linhas';

type Item = { kind: 'alerta'; alerta: AlertaResponse } | { kind: 'linha'; linha: LinhaResponse };

export default function AlertasScreen() {
  const theme = useTheme();
  const [aba, setAba] = useState<Aba>('alertas');
  const [linhaFiltro, setLinhaFiltro] = useState<string | null>(null);

  const fetcher = useCallback(async () => {
    const [linhas, alertas] = await Promise.all([listarLinhas(), listarAlertas(linhaFiltro ?? undefined)]);
    return { linhas: [...linhas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), alertas };
  }, [linhaFiltro]);

  const query = useFocusQuery(fetcher, 'Não foi possível carregar os alertas.');
  const { data } = query;

  const linhasById = useMemo(() => new Map(data?.linhas.map((linha) => [linha.id, linha])), [data]);

  const items: Item[] = useMemo(() => {
    if (!data) return [];
    return aba === 'alertas'
      ? data.alertas.map((alerta) => ({ kind: 'alerta', alerta }))
      : data.linhas.map((linha) => ({ kind: 'linha', linha }));
  }, [aba, data]);

  if (query.loading) return <LoadingView />;

  const linhas = data?.linhas ?? [];
  const filtroAtivo = linhaFiltro ? linhasById.get(linhaFiltro) : undefined;

  const header = (
    <View style={styles.header}>
      <Segmented<Aba>
        value={aba}
        onChange={setAba}
        options={[
          { value: 'alertas', label: 'Alertas', icon: 'warning' },
          { value: 'linhas', label: 'Linhas', icon: 'train' },
        ]}
      />

      <FormError message={query.error} />
      {query.error && (
        <Button title="Tentar novamente" variant="ghost" onPress={query.refresh} loading={query.refreshing} />
      )}

      {aba === 'alertas' ? (
        <>
          {linhas.length > 0 && (
            <LinhaPicker linhas={linhas} value={linhaFiltro} onChange={setLinhaFiltro} allLabel="Todas" />
          )}
          <Button
            title="Novo alerta"
            icon="add"
            disabled={linhas.length === 0}
            onPress={() =>
              router.push(linhaFiltro ? { pathname: '/alertas/novo', params: { linhaId: linhaFiltro } } : '/alertas/novo')
            }
          />
          {linhas.length === 0 && !query.error && (
            <ThemedText type="small" themeColor="textSecondary">
              Para registrar alertas, cadastre primeiro uma linha na aba Linhas.
            </ThemedText>
          )}
        </>
      ) : (
        <Button title="Nova linha" icon="add" variant="secondary" onPress={() => router.push('/alertas/linha')} />
      )}
    </View>
  );

  const empty = query.error ? null : (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: aba === 'alertas' ? theme.accentSoft : theme.primarySoft }]}>
        <Icon
          name={aba === 'alertas' ? 'check' : 'train'}
          size={28}
          color={aba === 'alertas' ? theme.accentText : theme.primaryText}
        />
      </View>
      <ThemedText type="heading" style={styles.center}>
        {aba === 'alertas' ? 'Tudo tranquilo por aqui' : 'Nenhuma linha cadastrada'}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {aba === 'alertas'
          ? filtroAtivo
            ? `Nenhum alerta para ${filtroAtivo.nome}.`
            : 'Nenhum alerta registrado no momento.'
          : 'Cadastre as linhas de metrô, trem e ônibus para associá-las aos trajetos.'}
      </ThemedText>
    </View>
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => (item.kind === 'alerta' ? item.alerta.id : item.linha.id)}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={query.refreshing}
          onRefresh={query.refresh}
          tintColor={theme.primaryText}
          colors={[theme.primary]}
        />
      }
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      renderItem={({ item }) =>
        item.kind === 'alerta' ? (
          <AlertaCard
            alerta={item.alerta}
            linha={linhasById.get(item.alerta.linhaId)}
            onPress={() => router.push(`/alertas/${item.alerta.id}`)}
          />
        ) : (
          <LinhaRow
            linha={item.linha}
            onPress={() => router.push({ pathname: '/alertas/linha', params: { id: item.linha.id } })}
          />
        )
      }
    />
  );
}

function LinhaRow({ linha, onPress }: { linha: LinhaResponse; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.linhaRow}>
        <LinhaIcon tipo={linha.tipo} />
        <View style={styles.flex}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {linha.nome}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {tipoLabel(linha.tipo)}
          </ThemedText>
        </View>
        <Icon name="chevronRight" size={20} color={theme.textSecondary} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
    flexGrow: 1,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  flex: {
    flex: 1,
  },
  linhaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.75,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
});
