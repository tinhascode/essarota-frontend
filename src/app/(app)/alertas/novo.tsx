import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { LinhaPicker } from '@/components/linha-picker';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { LoadingView, MessageView } from '@/components/ui/state-view';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useFocusQuery } from '@/hooks/use-focus-query';
import { SEVERIDADES } from '@/lib/format';
import { goBack } from '@/lib/navigation';
import { hasErrors, type FieldErrors } from '@/lib/validation';
import { criarAlerta } from '@/services/alertas';
import { ApiError } from '@/services/http';
import { listarLinhas } from '@/services/linhas';
import type { SeveridadeAlerta } from '@/types/api';

type Field = 'linhaId' | 'descricao' | 'severidade';

const DESCRICAO_MAX = 500;

export default function NovoAlertaScreen() {
  const params = useLocalSearchParams<{ linhaId?: string }>();

  const fetcher = useCallback(() => listarLinhas(), []);
  const query = useFocusQuery(fetcher, 'Não foi possível carregar as linhas.');

  const [linhaId, setLinhaId] = useState<string | null>(params.linhaId ?? null);
  const [descricao, setDescricao] = useState('');
  const [severidade, setSeveridade] = useState<SeveridadeAlerta>('MEDIA');
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (query.loading) return <LoadingView />;
  if (!query.data) {
    return <MessageView title="Algo deu errado" message={query.error} actionLabel="Tentar novamente" onAction={query.refresh} />;
  }

  async function handleSubmit() {
    const text = descricao.trim();
    const nextErrors: FieldErrors<Field> = {
      linhaId: linhaId ? undefined : 'Escolha a linha afetada',
      descricao: !text
        ? 'Descreva o que está acontecendo'
        : text.length > DESCRICAO_MAX
          ? `Use no máximo ${DESCRICAO_MAX} caracteres`
          : undefined,
    };
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors) || !linhaId) return;

    setSubmitting(true);
    try {
      const alerta = await criarAlerta({ linhaId, descricao: text, severidade });
      router.replace(`/alertas/${alerta.id}`);
    } catch (reason) {
      if (reason instanceof ApiError) {
        setErrors(reason.fieldErrors ?? {});
        setFormError(reason.message);
      } else {
        setFormError('Não foi possível registrar o alerta.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll edges={[]} contentStyle={styles.content}>
      <ThemedText type="small" themeColor="textSecondary">
        Avise a comunidade sobre atrasos, interrupções ou lotação em uma linha.
      </ThemedText>
      <FormError message={formError} />

      {query.data.length === 0 ? (
        <MessageView
          icon="train"
          title="Nenhuma linha cadastrada"
          message="Cadastre a linha antes de registrar um alerta."
          actionLabel="Cadastrar linha"
          onAction={() => router.replace('/alertas/linha')}
        />
      ) : (
        <>
          <LinhaPicker
            label="Linha afetada"
            linhas={query.data}
            value={linhaId}
            onChange={setLinhaId}
            error={errors.linhaId}
            wrap
          />
          <Segmented<SeveridadeAlerta>
            label="Severidade"
            value={severidade}
            onChange={setSeveridade}
            options={SEVERIDADES}
          />
          <TextField
            label="Descrição"
            placeholder="Ex.: Trens com intervalo de 15 minutos entre Luz e Brás"
            multiline
            maxLength={DESCRICAO_MAX}
            value={descricao}
            onChangeText={setDescricao}
            error={errors.descricao ?? errors.severidade}
            hint={`${descricao.length}/${DESCRICAO_MAX}`}
            style={styles.textarea}
          />
          <Button title="Registrar alerta" icon="warning" loading={submitting} onPress={handleSubmit} />
          <Button title="Cancelar" variant="ghost" onPress={() => goBack('/alertas')} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
  textarea: {
    minHeight: 120,
    paddingTop: Spacing.three,
    textAlignVertical: 'top',
  },
});
