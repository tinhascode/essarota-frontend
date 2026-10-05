import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AlertaCard } from '@/components/alerta-card';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { LoadingView, MessageView } from '@/components/ui/state-view';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { confirm, notify } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { TIPOS_TRANSPORTE, tipoIcon } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { hasErrors, type FieldErrors } from '@/lib/validation';
import { listarAlertas } from '@/services/alertas';
import { ApiError } from '@/services/http';
import { atualizarLinha, buscarLinha, criarLinha, excluirLinha } from '@/services/linhas';
import type { AlertaResponse, LinhaResponse, TipoTransporte } from '@/types/api';

type Field = 'nome' | 'tipo';

export default function LinhaScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  if (!id) return <LinhaForm linha={null} alertas={[]} />;
  return <LinhaEdit id={id} />;
}

function LinhaEdit({ id }: { id: string }) {
  const fetcher = useCallback(async () => {
    const [linha, alertas] = await Promise.all([buscarLinha(id), listarAlertas(id)]);
    return { linha, alertas };
  }, [id]);
  const query = useFocusQuery(fetcher, 'Não foi possível carregar a linha.');

  if (query.loading) return <LoadingView />;
  if (!query.data) {
    const notFound = query.status === 404;
    return (
      <MessageView
        icon="train"
        title={notFound ? 'Linha não encontrada' : 'Algo deu errado'}
        message={notFound ? 'Ela pode ter sido excluída.' : query.error}
        actionLabel={notFound ? 'Voltar' : 'Tentar novamente'}
        onAction={notFound ? () => goBack('/alertas') : query.refresh}
      />
    );
  }

  return <LinhaForm key={query.data.linha.id} linha={query.data.linha} alertas={query.data.alertas} />;
}

function LinhaForm({ linha, alertas }: { linha: LinhaResponse | null; alertas: AlertaResponse[] }) {
  const [nome, setNome] = useState(linha?.nome ?? '');
  const [tipo, setTipo] = useState<TipoTransporte>(linha?.tipo ?? 'METRO');
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit() {
    const value = nome.trim();
    const nextErrors: FieldErrors<Field> = {
      nome: value.length < 2 ? 'Informe o nome da linha' : undefined,
    };
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      const body = { nome: value, tipo };
      if (linha) await atualizarLinha(linha.id, body);
      else await criarLinha(body);
      goBack('/alertas');
    } catch (reason) {
      if (reason instanceof ApiError) {
        setErrors(reason.fieldErrors ?? {});
        setFormError(reason.message);
      } else {
        setFormError('Não foi possível salvar a linha.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!linha) return;
    const ok = await confirm({
      title: 'Excluir linha',
      message: `Excluir ${linha.nome}? Ela deixará de aparecer nos trajetos e alertas.`,
      confirmText: 'Excluir',
      destructive: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      await excluirLinha(linha.id);
      goBack('/alertas');
    } catch (reason) {
      notify('Erro', errorMessage(reason, 'Não foi possível excluir a linha.'));
      setDeleting(false);
    }
  }

  return (
    <Screen scroll edges={[]} contentStyle={styles.content}>
      <Stack.Screen options={{ title: linha ? 'Editar linha' : 'Nova linha' }} />
      <FormError message={formError} />
      <TextField
        label="Nome da linha"
        placeholder="Ex.: Linha 1 - Azul"
        returnKeyType="done"
        value={nome}
        onChangeText={setNome}
        onSubmitEditing={handleSubmit}
        error={errors.nome}
      />
      <Segmented<TipoTransporte>
        label="Tipo de transporte"
        value={tipo}
        onChange={setTipo}
        options={TIPOS_TRANSPORTE.map((item) => ({ ...item, icon: tipoIcon(item.value) }))}
      />
      {errors.tipo && (
        <ThemedText type="caption" themeColor="danger">
          {errors.tipo}
        </ThemedText>
      )}
      <Button
        title={linha ? 'Salvar alterações' : 'Cadastrar linha'}
        icon="check"
        variant={linha ? 'primary' : 'secondary'}
        loading={submitting}
        onPress={handleSubmit}
      />

      {linha && (
        <>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="heading">Alertas desta linha</ThemedText>
              <Button
                title="Novo"
                icon="add"
                variant="ghost"
                style={styles.smallButton}
                onPress={() => router.push({ pathname: '/alertas/novo', params: { linhaId: linha.id } })}
              />
            </View>
            {alertas.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nenhum alerta registrado para esta linha.
              </ThemedText>
            ) : (
              alertas.map((alerta) => (
                <AlertaCard
                  key={alerta.id}
                  alerta={alerta}
                  linha={linha}
                  onPress={() => router.push(`/alertas/${alerta.id}`)}
                />
              ))
            )}
          </View>
          <Button title="Excluir linha" icon="delete" variant="danger" loading={deleting} onPress={handleDelete} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallButton: {
    minHeight: 36,
    paddingHorizontal: Spacing.three,
  },
});
