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

type Field = 'nome' | 'email' | 'senha' | 'telefoneWhatsapp';

export default function CadastroScreen() {
  const { signUp } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);
  const telefoneRef = useRef<TextInput>(null);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const nextErrors: FieldErrors<Field> = {
      nome: validateNome(nome),
      email: validateEmail(email),
      senha: validateSenha(senha),
      telefoneWhatsapp: validateWhatsapp(telefone),
    };
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      await signUp({
        nome: nome.trim(),
        email: email.trim(),
        senha,
        telefoneWhatsapp: telefone.trim() ? normalizeWhatsapp(telefone) : null,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setErrors({ email: 'Este e-mail já está em uso' });
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
      <BrandHeader subtitle="Crie sua conta e salve seus trajetos." />

      <View style={styles.form}>
        <ThemedText type="subtitle">Criar conta</ThemedText>
        <FormError message={formError} />
        <TextField
          label="Nome"
          placeholder="Seu nome"
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
          placeholder="Mínimo de 6 caracteres"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          value={senha}
          onChangeText={setSenha}
          onSubmitEditing={() => telefoneRef.current?.focus()}
          error={errors.senha}
        />
        <TextField
          ref={telefoneRef}
          label="WhatsApp (opcional)"
          placeholder="+5511999998888"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="go"
          value={telefone}
          onChangeText={setTelefone}
          onSubmitEditing={handleSubmit}
          error={errors.telefoneWhatsapp}
          hint="Usaremos para avisar sobre problemas nas suas linhas."
        />
        <Button
          title="Criar conta"
          variant="secondary"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submit}
        />
      </View>

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          Já tem conta?
        </ThemedText>
        <Link href="/login" replace>
          <ThemedText type="link">Entrar</ThemedText>
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
