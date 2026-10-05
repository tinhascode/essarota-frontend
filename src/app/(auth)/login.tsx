import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Spacing } from '@/constants/theme';
import { hasErrors, validateEmail, validateSenha, type FieldErrors } from '@/lib/validation';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/http';

type Field = 'email' | 'senha';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const senhaRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const nextErrors = { email: validateEmail(email), senha: validateSenha(senha) };
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), senha });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setFormError('E-mail ou senha incorretos.');
        } else {
          setErrors(error.fieldErrors ?? {});
          setFormError(error.message);
        }
      } else {
        setFormError('Algo deu errado. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll contentStyle={styles.content}>
      <ThemeToggle style={styles.toggle} />
      <BrandHeader subtitle="Seu trajeto do dia a dia, sem surpresas." />

      <View style={styles.form}>
        <ThemedText type="subtitle">Entrar</ThemedText>
        <FormError message={formError} />
        <TextField
          label="E-mail"
          placeholder="voce@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => senhaRef.current?.focus()}
          error={errors.email}
        />
        <TextField
          ref={senhaRef}
          label="Senha"
          placeholder="Sua senha"
          secureTextEntry
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          value={senha}
          onChangeText={setSenha}
          onSubmitEditing={handleSubmit}
          error={errors.senha}
        />
        <Button title="Entrar" onPress={handleSubmit} loading={submitting} style={styles.submit} />
      </View>

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          Ainda não tem conta?
        </ThemedText>
        <Link href="/cadastro" replace>
          <ThemedText type="link" themeColor="accentText">
            Criar conta
          </ThemedText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    maxWidth: 440,
  },
  toggle: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.four,
    zIndex: 1,
  },
  form: {
    gap: Spacing.three,
  },
  submit: {
    marginTop: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
