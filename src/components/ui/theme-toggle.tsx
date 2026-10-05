import type { StyleProp, ViewStyle } from 'react-native';

import { IconButton } from '@/components/ui/icon-button';
import { useAppTheme } from '@/providers/theme-provider';

export function ThemeToggle({ style }: { style?: StyleProp<ViewStyle> }) {
  const { scheme, toggleScheme } = useAppTheme();
  const isDark = scheme === 'dark';

  return (
    <IconButton
      icon={isDark ? 'sun' : 'moon'}
      accessibilityLabel={isDark ? 'Usar tema claro' : 'Usar tema escuro'}
      onPress={toggleScheme}
      style={style}
    />
  );
}
