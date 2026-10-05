import type { NativeStackNavigationOptions } from 'expo-router/native-stack';
import { Platform } from 'react-native';

import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function useStackOptions(): NativeStackNavigationOptions {
  const theme = useTheme();
  return {
    headerStyle: { backgroundColor: theme.background },
    headerShadowVisible: false,
    headerTintColor: theme.primaryText,
    headerTitleStyle: { color: theme.text, fontWeight: '800' },
    headerBackButtonDisplayMode: 'minimal',
    contentStyle: { backgroundColor: theme.background },
  };
}

export const withThemeToggle: NativeStackNavigationOptions = {
  headerRight: () => <ThemeToggle style={Platform.OS === 'web' && { marginRight: Spacing.three }} />,
};
