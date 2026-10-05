import { useRef, useState } from 'react';
import { StyleSheet, type TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { notify } from '@/lib/confirm';
import { goBack } from '@/lib/navigation';
import {
  hasErrors,
  normalizeWhatsapp,
  validateEmail,
  validateNome,
  validateSenha,
  validateWhatsapp,
  type FieldErrors,
} from '@/lib/validation';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/http';
import { atualizarUsuario } from '@/services/usuarios';

type Field = 'nome' | 'email' | 'senha' | 'telefoneWhatsapp';

export default function EditarPerfilScreen() {
  const { profile, refreshProfile, applyUser, signIn, signOut } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const telefoneRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);

  const [nome, setNome] = useState(profile?.nome ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [telefone, setTelefone] = useState(profile?.telefoneWhatsapp ?? '');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const nextErrors: FieldErrors<Field> = {
      nome: validateNome(nome),
      email: validateEmail(email),
      senha: senha ? validateSenha(senha) : undefined,
      telefoneWhatsapp: validateWhatsapp(telefone),
    };
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      const id = profile?.id ?? (await refreshProfile())?.id;
      if (!id) {
        setFormError('Não foi possível identificar sua conta. Entre novamente e tente de novo.');
        return;
      }
      const nextEmail = email.trim().toLowerCase();
      const emailChanged = nextEmail !== profile?.email;
      const updated = await atualizarUsuario(id, {
        nome: nome.trim(),
        email: email.trim(),
        senha: senha || undefined,
        telefoneWhatsapp: telefone.trim() ? normalizeWhatsapp(telefone) : null,
      });
      applyUser(updated);

      if (emailChanged) {
        if (senha) {
          await signIn({ email: updated.email, senha });
        } else {
          notify('E-mail alterado', 'Entre novamente usando o novo e-mail.');
          signOut();
          return;
        }
      }
      goBack('/perfil');
    } catch (reason) {
      if (reason instanceof ApiError) {
        if (reason.status === 409) {
          setErrors({ email: 'Este e-mail já está em uso' });
        } else {
          setErrors(reason.fieldErrors ?? {});
          setFormError(reason.message);
        }
      } else {
        setFormError('Não foi possível salvar seus dados.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll edges={[]} contentStyle={styles.content}>
      <FormError message={formError} />
      <TextField
        label="Nome"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        value={nome}
        onChangeText={setNome}
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.nome}
      />
      <TextField
        ref={emailRef}
        label="E-mail"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={() => telefoneRef.current?.focus()}
        error={errors.email}
      />
      <TextField
        ref={telefoneRef}
        label="WhatsApp (opcional)"
        placeholder="+5511999998888"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        returnKeyType="next"
        value={telefone}
        onChangeText={setTelefone}
        onSubmitEditing={() => senhaRef.current?.focus()}
        error={errors.telefoneWhatsapp}
      />
      <TextField
        ref={senhaRef}
        label="Nova senha (opcional)"
        placeholder="Deixe em branco para manter a atual"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        value={senha}
        onChangeText={setSenha}
        onSubmitEditing={handleSubmit}
        error={errors.senha}
      />
      <ThemedText type="caption" themeColor="textSecondary">
        Se você alterar o e-mail sem definir uma nova senha, será preciso entrar novamente.
      </ThemedText>
      <Button title="Salvar alterações" icon="check" loading={submitting} onPress={handleSubmit} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
