import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function BrandWordmark({ size = 32 }: { size?: number }) {
  const theme = useTheme();
  return (
    <Text style={[styles.wordmark, { fontSize: size, lineHeight: size * 1.2 }]}>
      <Text style={{ color: theme.primaryText }}>Essa</Text>
      <Text style={{ color: theme.accentText }}>Rota</Text>
    </Text>
  );
}

export function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/essarota/essarota-logo-sem-fundo.png')}
        style={styles.logo}
        contentFit="contain"
        accessibilityLabel="Logo EssaRota"
      />
      <BrandWordmark />
      {subtitle && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  logo: {
    width: 220,
    aspectRatio: 1530 / 960,
  },
  wordmark: {
    fontWeight: 800,
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
  },
});
