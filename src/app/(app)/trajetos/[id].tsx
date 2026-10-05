import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AlertaCard } from '@/components/alerta-card';
import { LinhaIcon } from '@/components/linha-badge';
import { LinhaPicker } from '@/components/linha-picker';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { LoadingView, MessageView } from '@/components/ui/state-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import { confirm, notify } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { tipoLabel } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { listarAlertas } from '@/services/alertas';
import { listarLinhas } from '@/services/linhas';
import { associarLinha, listarLinhasDoTrajeto, removerLinha } from '@/services/trajeto-linhas';
import { buscarTrajeto } from '@/services/trajetos';

export default function TrajetoDetalheScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const fetcher = useCallback(async () => {
    const [trajeto, associacoes, linhas, alertas] = await Promise.all([
      buscarTrajeto(id),
      listarLinhasDoTrajeto(id),
      listarLinhas(),
      listarAlertas(),
    ]);
    return { trajeto, associacoes, linhas, alertas };
  }, [id]);

  const query = useFocusQuery(fetcher, 'Não foi possível carregar o trajeto.');
  const { data, refresh } = query;

  const [adding, setAdding] = useState(false);
  const [selectedLinhaId, setSelectedLinhaId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const linhasById = useMemo(() => new Map(data?.linhas.map((linha) => [linha.id, linha])), [data]);
  const linkedIds = useMemo(() => new Set(data?.associacoes.map((item) => item.linhaId)), [data]);
  const disponiveis = data?.linhas.filter((linha) => !linkedIds.has(linha.id)) ?? [];
  const alertas = data?.alertas.filter((alerta) => linkedIds.has(alerta.linhaId)) ?? [];

  if (query.loading) return <LoadingView />;

  if (!data) {
    const forbidden = query.status === 403;
    const notFound = query.status === 404;
    return (
      <MessageView
        icon={forbidden ? 'close' : 'route'}
        title={forbidden ? 'Este trajeto não pertence a você' : notFound ? 'Trajeto não encontrado' : 'Algo deu errado'}
        message={forbidden || notFound ? 'Ele pode ter sido removido ou pertencer a outra conta.' : query.error}
        actionLabel={forbidden || notFound ? 'Voltar' : 'Tentar novamente'}
        onAction={forbidden || notFound ? () => goBack('/trajetos') : refresh}
      />
    );
  }

  const { trajeto, associacoes } = data;

  async function handleAssociar() {
    if (!selectedLinhaId) {
      setActionError('Escolha uma linha para associar.');
      return;
    }
    const ordem = associacoes.reduce((max, item) => Math.max(max, item.ordem), 0) + 1;
    setSaving(true);
    setActionError(null);
    try {
      await associarLinha(trajeto.id, { linhaId: selectedLinhaId, ordem });
      setSelectedLinhaId(null);
      setAdding(false);
      await refresh();
    } catch (reason) {
      setActionError(errorMessage(reason, 'Não foi possível associar a linha.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemover(linhaId: string) {
    const nome = linhasById.get(linhaId)?.nome ?? 'esta linha';
    const ok = await confirm({
      title: 'Remover linha',
      message: `Remover ${nome} deste trajeto?`,
      confirmText: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    setRemovingId(linhaId);
    try {
      await removerLinha(trajeto.id, linhaId);
      await refresh();
    } catch (reason) {
      notify('Erro', errorMessage(reason, 'Não foi possível remover a linha.'));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={query.refreshing}
          onRefresh={refresh}
          tintColor={theme.primaryText}
          colors={[theme.primary]}
        />
      }>
      <Card elevated style={styles.summary}>
        <View style={styles.summaryRow}>
          <View style={[styles.dot, { borderColor: theme.accent }]} />
          <ThemedText type="smallBold" style={styles.flex} numberOfLines={2}>
            {trajeto.origem}
          </ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <Icon name="pin" size={16} color={theme.primary} />
          <ThemedText type="smallBold" style={styles.flex} numberOfLines={2}>
            {trajeto.destino}
          </ThemedText>
        </View>
        <View style={[styles.summaryFooter, { borderTopColor: theme.border }]}>
          <View style={[styles.timeChip, { backgroundColor: theme.primarySoft }]}>
            <Icon name="clock" size={14} color={theme.primaryText} />
            <ThemedText type="caption" themeColor="primaryText" style={styles.bold}>
              ~{trajeto.tempoEstimadoMinutos} min
            </ThemedText>
          </View>
          <Button
            title="Editar no mapa"
            icon="edit"
            variant="ghost"
            style={styles.smallButton}
            onPress={() => router.navigate({ pathname: '/', params: { trajetoId: trajeto.id } })}
          />
        </View>
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="heading">Linhas do trajeto</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {associacoes.length} {associacoes.length === 1 ? 'linha' : 'linhas'}
          </ThemedText>
        </View>

        {associacoes.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nenhuma linha associada ainda. Adicione as linhas que você pega neste percurso, na ordem em que as usa.
          </ThemedText>
        ) : (
          <Card style={styles.list}>
            {associacoes.map((item, index) => {
              const linha = linhasById.get(item.linhaId);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.linhaRow,
                    index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
                    removingId === item.linhaId && styles.faded,
                  ]}>
                  <View style={[styles.ordem, { backgroundColor: theme.primary }]}>
                    <ThemedText type="caption" style={[styles.bold, { color: theme.onPrimary }]}>
                      {item.ordem}
                    </ThemedText>
                  </View>
                  <LinhaIcon tipo={linha?.tipo ?? ''} size={36} />
                  <View style={styles.flex}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {linha?.nome ?? 'Linha removida'}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {linha ? tipoLabel(linha.tipo) : '—'}
                    </ThemedText>
                  </View>
                  <IconButton
                    icon="delete"
                    size={34}
                    color={theme.danger}
                    accessibilityLabel={`Remover ${linha?.nome ?? 'linha'}`}
                    onPress={() => handleRemover(item.linhaId)}
                  />
                </View>
              );
            })}
          </Card>
        )}

        {adding ? (
          <Card style={styles.addCard}>
            {data.linhas.length === 0 ? (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  Ainda não há linhas cadastradas. Cadastre a primeira na aba Alertas.
                </ThemedText>
                <Button
                  title="Cadastrar linha"
                  icon="add"
                  variant="secondary"
                  onPress={() => router.push('/alertas/linha', { withAnchor: true })}
                />
              </>
            ) : disponiveis.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Todas as linhas cadastradas já estão neste trajeto.
              </ThemedText>
            ) : (
              <LinhaPicker
                label="Escolha a linha"
                linhas={disponiveis}
                value={selectedLinhaId}
                onChange={setSelectedLinhaId}
                wrap
              />
            )}
            <FormError message={actionError} />
            <View style={styles.row}>
              <Button
                title="Cancelar"
                variant="ghost"
                style={styles.flex}
                onPress={() => {
                  setAdding(false);
                  setActionError(null);
                }}
              />
              {disponiveis.length > 0 && (
                <Button title="Associar" icon="check" style={styles.flex} loading={saving} onPress={handleAssociar} />
              )}
            </View>
          </Card>
        ) : (
          <Button title="Adicionar linha" icon="add" variant="secondary" onPress={() => setAdding(true)} />
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="heading">Alertas das suas linhas</ThemedText>
          {alertas.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: theme.dangerSoft }]}>
              <ThemedText type="caption" style={[styles.bold, { color: theme.danger }]}>
                {alertas.length}
              </ThemedText>
            </View>
          )}
        </View>
        {alertas.length === 0 ? (
          <View style={[styles.calm, { backgroundColor: theme.accentSoft }]}>
            <Icon name="check" size={18} color={theme.accentText} />
            <ThemedText type="small" themeColor="accentText" style={styles.flex}>
              {associacoes.length === 0
                ? 'Associe linhas para acompanhar os alertas delas aqui.'
                : 'Nenhum alerta nas linhas deste trajeto. Boa viagem!'}
            </ThemedText>
          </View>
        ) : (
          alertas.map((alerta) => (
            <AlertaCard
              key={alerta.id}
              alerta={alerta}
              linha={linhasById.get(alerta.linhaId)}
              onPress={() => router.push(`/alertas/${alerta.id}`, { withAnchor: true })}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  bold: {
    fontWeight: 800,
  },
  faded: {
    opacity: 0.5,
  },
  summary: {
    gap: Spacing.two,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 4,
    marginHorizontal: 1,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
  },
  smallButton: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    paddingVertical: Spacing.one,
    gap: 0,
  },
  linhaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  ordem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  countBadge: {
    minWidth: 24,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    alignItems: 'center',
  },
  calm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
});
