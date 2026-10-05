import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinhaIcon } from '@/components/linha-badge';
import { SeveridadeChip } from '@/components/severidade-chip';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { LoadingView, MessageView } from '@/components/ui/state-view';
import { Radius, Spacing } from '@/constants/theme';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { useTheme } from '@/hooks/use-theme';
import { confirm, notify } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { CANAIS, canalLabel, formatDateTime, severidadeColors, tipoLabel } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { useAuth } from '@/providers/auth-provider';
import { buscarAlerta, excluirAlerta } from '@/services/alertas';
import { buscarLinha } from '@/services/linhas';
import { registrarNotificacao } from '@/services/notificacoes';
import type { CanalNotificacao, NotificacaoResponse } from '@/types/api';

export default function AlertaDetalheScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, refreshProfile } = useAuth();

  const fetcher = useCallback(async () => {
    const alerta = await buscarAlerta(id);
    const linha = await buscarLinha(alerta.linhaId).catch(() => null);
    return { alerta, linha };
  }, [id]);
  const query = useFocusQuery(fetcher, 'Não foi possível carregar o alerta.');

  const [canal, setCanal] = useState<CanalNotificacao>(profile?.telefoneWhatsapp ? 'WHATSAPP' : 'PUSH');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [registrada, setRegistrada] = useState<NotificacaoResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (query.loading) return <LoadingView />;
  if (!query.data) {
    const notFound = query.status === 404;
    return (
      <MessageView
        title={notFound ? 'Alerta não encontrado' : 'Algo deu errado'}
        message={notFound ? 'Ele pode ter sido excluído.' : query.error}
        actionLabel={notFound ? 'Voltar' : 'Tentar novamente'}
        onAction={notFound ? () => goBack('/alertas') : query.refresh}
      />
    );
  }

  const { alerta, linha } = query.data;
  const severity = severidadeColors(alerta.severidade);

  async function handleRegistrar() {
    setSending(true);
    setSendError(null);
    try {
      const usuarioId = profile?.id ?? (await refreshProfile())?.id;
      if (!usuarioId) {
        setSendError('Não foi possível identificar sua conta. Entre novamente e tente de novo.');
        return;
      }
      setRegistrada(await registrarNotificacao({ usuarioId, alertaId: alerta.id, canal }));
    } catch (reason) {
      setSendError(errorMessage(reason, 'Não foi possível registrar a notificação.'));
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Excluir alerta',
      message: 'Este alerta deixará de aparecer para todos.',
      confirmText: 'Excluir',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await excluirAlerta(alerta.id);
      goBack('/alertas');
    } catch (reason) {
      notify('Erro', errorMessage(reason, 'Não foi possível excluir o alerta.'));
      setDeleting(false);
    }
  }

  return (
    <Screen scroll edges={[]} contentStyle={styles.content}>
      <Card elevated style={[styles.hero, { borderTopColor: theme[severity.color] }]}>
        <View style={styles.heroTop}>
          <SeveridadeChip severidade={alerta.severidade} />
          <View style={styles.date}>
            <Icon name="clock" size={14} color={theme.textSecondary} />
            <ThemedText type="caption" themeColor="textSecondary">
              {formatDateTime(alerta.criadoEm)}
            </ThemedText>
          </View>
        </View>
        <ThemedText type="heading">{alerta.descricao}</ThemedText>
      </Card>

      <Card style={styles.linhaCard}>
        <LinhaIcon tipo={linha?.tipo ?? ''} />
        <View style={styles.flex}>
          <ThemedText type="caption" themeColor="textSecondary">
            Linha afetada
          </ThemedText>
          <ThemedText type="smallBold" numberOfLines={1}>
            {linha ? `${linha.nome} · ${tipoLabel(linha.tipo)}` : 'Linha removida'}
          </ThemedText>
        </View>
        {linha && (
          <Button
            title="Ver"
            variant="ghost"
            style={styles.smallButton}
            onPress={() => router.push({ pathname: '/alertas/linha', params: { id: linha.id } })}
          />
        )}
      </Card>

      <View style={styles.section}>
        <ThemedText type="heading">Registrar notificação</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          O envio automático ainda está em desenvolvimento. Por enquanto, registre que você foi avisado sobre este
          alerta para ele aparecer no seu histórico.
        </ThemedText>
        {registrada ? (
          <View style={[styles.success, { backgroundColor: theme.accentSoft }]}>
            <Icon name="check" size={20} color={theme.accentText} />
            <View style={styles.flex}>
              <ThemedText type="smallBold" themeColor="accentText">
                Notificação registrada via {canalLabel(registrada.canal)}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {formatDateTime(registrada.enviadoEm)}
              </ThemedText>
            </View>
            <Button
              title="Histórico"
              variant="ghost"
              style={styles.smallButton}
              onPress={() => router.push('/perfil/notificacoes', { withAnchor: true })}
            />
          </View>
        ) : (
          <>
            <Segmented<CanalNotificacao>
              label="Canal"
              value={canal}
              onChange={setCanal}
              options={CANAIS.map((item) => ({ ...item, icon: item.value === 'WHATSAPP' ? 'chat' : 'bell' }))}
            />
            {canal === 'WHATSAPP' && !profile?.telefoneWhatsapp && (
              <ThemedText type="caption" themeColor="textSecondary">
                Você ainda não cadastrou um WhatsApp. Adicione em Perfil › Editar dados.
              </ThemedText>
            )}
            <FormError message={sendError} />
            <Button title="Registrar notificação" icon="bell" variant="secondary" loading={sending} onPress={handleRegistrar} />
          </>
        )}
      </View>

      <Button title="Excluir alerta" icon="delete" variant="danger" loading={deleting} onPress={handleDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  hero: {
    borderTopWidth: 4,
    gap: Spacing.three,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  linhaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  smallButton: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
  },
  section: {
    gap: Spacing.two,
  },
  success: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
});
