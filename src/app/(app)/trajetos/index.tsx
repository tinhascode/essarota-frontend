import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TrajetoCard } from '@/components/trajeto-card';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm, notify } from '@/lib/confirm';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/http';
import { excluirTrajeto, listarTrajetos } from '@/services/trajetos';
import type { TrajetoResponse } from '@/types/api';

export default function TrajetosScreen() {
  const theme = useTheme();
  const { profile } = useAuth();

  const [trajetos, setTrajetos] = useState<TrajetoResponse[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setTrajetos(await listarTrajetos());
      setError(null);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Não foi possível carregar seus trajetos.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function handleEdit(trajeto: TrajetoResponse) {
    router.navigate({ pathname: '/', params: { trajetoId: trajeto.id } });
  }

  async function handleDelete(trajeto: TrajetoResponse) {
    const ok = await confirm({
      title: 'Excluir trajeto',
      message: `${trajeto.origem} → ${trajeto.destino}`,
      confirmText: 'Excluir',
      destructive: true,
    });
    if (!ok) return;

    setDeletingId(trajeto.id);
    try {
      await excluirTrajeto(trajeto.id);
      setTrajetos((current) => current?.filter((item) => item.id !== trajeto.id) ?? null);
    } catch (reason) {
      notify('Erro', reason instanceof ApiError ? reason.message : 'Não foi possível excluir o trajeto.');
    } finally {
      setDeletingId(null);
    }
  }

  if (trajetos === null && !error) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primaryText} size="large" />
      </View>
    );
  }

  const firstName = profile?.nome?.split(' ')[0];
  const count = trajetos?.length ?? 0;

  return (
    <FlatList
      data={trajetos ?? []}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primaryText}
          colors={[theme.primary]}
        />
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <ThemedText type="subtitle">{firstName ? `Olá, ${firstName}!` : 'Olá!'}</ThemedText>
          {trajetos && (
            <ThemedText type="small" themeColor="textSecondary">
              {count === 0
                ? 'Você ainda não salvou nenhum trajeto.'
                : `Você tem ${count} ${count === 1 ? 'trajeto salvo' : 'trajetos salvos'}.`}
            </ThemedText>
          )}
          <FormError message={error} />
          {error && <Button title="Tentar novamente" variant="ghost" onPress={handleRefresh} loading={refreshing} />}
        </View>
      }
      ListEmptyComponent={
        error ? null : (
          <View style={styles.empty}>
            <Image
              source={require('@/assets/essarota/essarota-logo-sem-fundo.png')}
              style={styles.emptyLogo}
              contentFit="contain"
            />
            <ThemedText type="heading" style={styles.centerText}>
              Bora planejar sua rota?
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              Escolha origem e destino no mapa e salve seu trajeto do dia a dia.
            </ThemedText>
            <Button title="Criar trajeto" icon="add" variant="secondary" onPress={() => router.navigate('/')} />
          </View>
        )
      }
      renderItem={({ item }) => (
        <TrajetoCard
          trajeto={item}
          deleting={deletingId === item.id}
          onPress={() => router.push(`/trajetos/${item.id}`)}
          onEdit={() => handleEdit(item)}
          onDelete={() => handleDelete(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
    flexGrow: 1,
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  emptyLogo: {
    width: 200,
    aspectRatio: 1530 / 960,
    marginBottom: Spacing.two,
  },
  centerText: {
    textAlign: 'center',
  },
});
