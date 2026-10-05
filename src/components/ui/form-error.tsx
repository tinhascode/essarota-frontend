import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function FormError({ message }: { message: string | null }) {
  const theme = useTheme();
  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[styles.container, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
      <ThemedText type="small" themeColor="danger">
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
