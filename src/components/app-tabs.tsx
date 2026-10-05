import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm } from '@/lib/confirm';
import { useAuth } from '@/providers/auth-provider';

function HeaderActions() {
  const theme = useTheme();
  const { signOut } = useAuth();

  async function handleSignOut() {
    const ok = await confirm({
      title: 'Sair da conta',
      message: 'Você precisará entrar novamente para ver seus trajetos.',
      confirmText: 'Sair',
      destructive: true,
    });
    if (ok) signOut();
  }

  return (
    <View style={styles.headerActions}>
      <ThemeToggle />
      <IconButton
        icon="logout"
        accessibilityLabel="Sair da conta"
        color={theme.danger}
        onPress={handleSignOut}
      />
    </View>
  );
}

export default function AppTabs() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.text, fontWeight: '800' },
        headerRight: () => <HeaderActions />,
        tabBarActiveTintColor: theme.primaryText,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.background, borderTopColor: theme.border },
        tabBarLabelStyle: { fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Icon name="map" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="trajetos"
        options={{
          title: 'Meus trajetos',
          tabBarLabel: 'Trajetos',
          tabBarIcon: ({ color, size }) => <Icon name="route" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginRight: Spacing.three,
  },
});
