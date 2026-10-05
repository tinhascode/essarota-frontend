import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandWordmark } from '@/components/brand-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm, notify } from '@/lib/confirm';
import { errorMessage } from '@/lib/errors';
import { initials } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import { useAppTheme, type ThemePreference } from '@/providers/theme-provider';
import { excluirUsuario } from '@/services/usuarios';

export default function PerfilScreen() {
  const theme = useTheme();
  const { preference, setPreference } = useAppTheme();
  const { profile, refreshProfile, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );

  async function handleSignOut() {
    const ok = await confirm({
      title: 'Sair da conta',
      message: 'Você precisará entrar novamente para ver seus trajetos.',
      confirmText: 'Sair',
      destructive: true,
    });
    if (ok) signOut();
  }

  async function handleDeleteAccount() {
    const ok = await confirm({
      title: 'Excluir conta',
      message: 'Sua conta e seus trajetos serão removidos permanentemente. Essa ação não pode ser desfeita.',
      confirmText: 'Excluir conta',
      destructive: true,
    });
    if (!ok) return;

    setDeleting(true);
    try {
      const id = profile?.id ?? (await refreshProfile())?.id;
      if (!id) throw new Error('missing id');
      await excluirUsuario(id);
      signOut({ forget: true });
    } catch (reason) {
      notify('Erro', errorMessage(reason, 'Não foi possível excluir sua conta agora.'));
      setDeleting(false);
    }
  }

  const email = profile?.email ?? '';

  return (
    <Screen scroll edges={[]} contentStyle={styles.content}>
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: theme.primary, borderColor: theme.accent }]}>
          <ThemedText type="subtitle" style={{ color: theme.onPrimary }}>
            {initials(profile?.nome, email || 'EssaRota')}
          </ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.center}>
          {profile?.nome ?? 'Sua conta'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {email}
        </ThemedText>
        {profile?.telefoneWhatsapp && (
          <View style={[styles.whatsapp, { backgroundColor: theme.accentSoft }]}>
            <Icon name="chat" size={14} color={theme.accentText} />
            <ThemedText type="caption" themeColor="accentText" style={styles.bold}>
              {profile.telefoneWhatsapp}
            </ThemedText>
          </View>
        )}
      </View>

      <Card style={styles.menu}>
        <MenuItem icon="edit" label="Editar dados" href="/perfil/editar" />
        <MenuItem icon="bell" label="Histórico de notificações" href="/perfil/notificacoes" divider />
        <MenuItem icon="route" label="Meus trajetos" href="/trajetos" divider />
      </Card>

      <Segmented<ThemePreference>
        label="Aparência"
        value={preference}
        onChange={setPreference}
        options={[
          { value: 'system', label: 'Sistema' },
          { value: 'light', label: 'Claro', icon: 'sun' },
          { value: 'dark', label: 'Escuro', icon: 'moon' },
        ]}
      />

      <View style={styles.actions}>
        <Button title="Sair da conta" icon="logout" variant="ghost" onPress={handleSignOut} />
        <Button
          title="Excluir conta"
          icon="delete"
          variant="danger"
          loading={deleting}
          onPress={handleDeleteAccount}
        />
      </View>

      <View style={styles.footer}>
        <BrandWordmark size={16} />
      </View>
    </Screen>
  );
}

function MenuItem({ icon, label, href, divider }: { icon: IconName; label: string; href: Href; divider?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.menuItem,
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.menuIcon, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} size={18} color={theme.primaryText} />
      </View>
      <ThemedText type="smallBold" style={styles.flex}>
        {label}
      </ThemedText>
      <Icon name="chevronRight" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  bold: {
    fontWeight: 700,
  },
  center: {
    textAlign: 'center',
  },
  identity: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  whatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: 999,
    marginTop: Spacing.one,
  },
  menu: {
    paddingVertical: Spacing.one,
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  actions: {
    gap: Spacing.two,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
});
