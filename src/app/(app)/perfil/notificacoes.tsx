import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { SeveridadeChip } from '@/components/severidade-chip';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Icon } from '@/components/ui/icon';
import { LoadingView } from '@/components/ui/state-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import { notify } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { canalLabel, formatDateTime } from '@/lib/format';
import { INBOX_POLL_MS, useInbox } from '@/providers/inbox-provider';
import { buscarAlerta } from '@/services/alertas';
import { buscarLinha } from '@/services/linhas';
import { dispararNotificacaoMock, minhasNotificacoes } from '@/services/notificacoes';
import type { AlertaResponse, LinhaResponse, NotificacaoResponse } from '@/types/api';

const alertaCache = new Map<string, AlertaResponse | null>();
const linhaCache = new Map<string, LinhaResponse | null>();

async function loadAlertas(ids: string[]) {
  const missing = ids.filter((id) => !alertaCache.has(id));
  await Promise.all(
    missing.map(async (id) => {
      alertaCache.set(id, await buscarAlerta(id).catch(() => null));
    })
  );
  return new Map(ids.map((id) => [id, alertaCache.get(id) ?? null]));
}

async function loadLinhas(ids: string[]) {
  const missing = ids.filter((id) => !linhaCache.has(id));
  await Promise.all(
    missing.map(async (id) => {
      linhaCache.set(id, await buscarLinha(id).catch(() => null));
    })
  );
  return new Map(ids.map((id) => [id, linhaCache.get(id) ?? null]));
}

export default function NotificacoesScreen() {
  const theme = useTheme();
  const { markAllSeen, refresh: refreshInbox } = useInbox();
  const [mocking, setMocking] = useState(false);

  const fetcher = useCallback(async () => {
    const notificacoes = await minhasNotificacoes();
    const alertas = await loadAlertas([...new Set(notificacoes.map((item) => item.alertaId))]);
    const linhaIds = [...alertas.values()].flatMap((alerta) => (alerta ? [alerta.linhaId] : []));
    const linhas = await loadLinhas([...new Set(linhaIds)]);
    return { notificacoes, alertas, linhas };
  }, []);
  const query = useFocusQuery(fetcher, 'Não foi possível carregar suas notificações.', INBOX_POLL_MS);

  const seenKey = query.data?.notificacoes.map((item) => item.id).join(',') ?? '';
  useEffect(() => {
    if (!seenKey) return;
    markAllSeen(seenKey.split(','));
  }, [seenKey, markAllSeen]);

  async function handleMock() {
    setMocking(true);
    try {
      await dispararNotificacaoMock({ codigoIntegracao: '9', normalizacao: false });
      await Promise.all([query.refresh(), refreshInbox()]);
    } catch (reason) {
      notify('Erro', errorMessage(reason, 'Não foi possível simular a notificação.'));
    } finally {
      setMocking(false);
    }
  }

  if (query.loading) return <LoadingView />;

  return (
    <FlatList
      data={query.data?.notificacoes ?? []}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={query.refreshing}
          onRefresh={query.refresh}
          tintColor={theme.primaryText}
          colors={[theme.primary]}
        />
      }
      ListHeaderComponent={
        query.error || __DEV__ ? (
          <View style={styles.header}>
            {query.error ? (
              <>
                <FormError message={query.error} />
                <Button title="Tentar novamente" variant="ghost" onPress={query.refresh} loading={query.refreshing} />
              </>
            ) : null}
            {__DEV__ ? (
              <Button
                title="Simular alerta (dev)"
                icon="bell"
                variant="secondary"
                loading={mocking}
                onPress={handleMock}
              />
            ) : null}
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        query.error ? undefined : (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
              <Icon name="bell" size={28} color={theme.primaryText} />
            </View>
            <ThemedText type="heading" style={styles.center}>
              Nenhuma notificação ainda
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              Quando você for avisado sobre alertas nas suas linhas, eles aparecerão aqui.
            </ThemedText>
          </View>
        )
      }
      renderItem={({ item }) => {
        const alerta = query.data?.alertas.get(item.alertaId) ?? null;
        return (
          <NotificacaoItem
            notificacao={item}
            alerta={alerta}
            linha={alerta ? (query.data?.linhas.get(alerta.linhaId) ?? null) : null}
          />
        );
      }}
    />
  );
}

function NotificacaoItem({
  notificacao,
  alerta,
  linha,
}: {
  notificacao: NotificacaoResponse;
  alerta: AlertaResponse | null;
  linha: LinhaResponse | null;
}) {
  const theme = useTheme();
  const isWhatsapp = notificacao.canal === 'WHATSAPP';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!alerta}
      onPress={() => alerta && router.push(`/alertas/${alerta.id}`, { withAnchor: true })}
      style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.item}>
        <View style={[styles.canalIcon, { backgroundColor: isWhatsapp ? theme.accentSoft : theme.primarySoft }]}>
          <Icon
            name={isWhatsapp ? 'chat' : 'bell'}
            size={18}
            color={isWhatsapp ? theme.accentText : theme.primaryText}
          />
        </View>
        <View style={styles.body}>
          <View style={styles.meta}>
            <ThemedText type="caption" themeColor="textSecondary">
              {canalLabel(notificacao.canal)}
              {linha ? ` · ${linha.nome}` : ''} · {formatDateTime(notificacao.enviadoEm)}
            </ThemedText>
            {alerta && <SeveridadeChip severidade={alerta.severidade} />}
          </View>
          <ThemedText type="small" numberOfLines={3} themeColor={alerta ? 'text' : 'textSecondary'}>
            {alerta?.descricao ?? 'Alerta removido'}
          </ThemedText>
        </View>
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
    gap: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  canalIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: Spacing.one,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
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
