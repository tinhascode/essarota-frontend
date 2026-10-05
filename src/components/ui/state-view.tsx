import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function LoadingView() {
  const theme = useTheme();
  return (
    <View style={[styles.centered, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.primaryText} size="large" />
    </View>
  );
}

type MessageViewProps = {
  icon?: IconName;
  title: string;
  message?: string | null;
  actionLabel?: string;
  onAction?: () => void;
};

export function MessageView({ icon = 'warning', title, message, actionLabel, onAction }: MessageViewProps) {
  const theme = useTheme();
  return (
    <View style={[styles.centered, styles.padded, { backgroundColor: theme.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
        <Icon name={icon} size={30} color={theme.primaryText} />
      </View>
      <ThemedText type="heading" style={styles.center}>
        {title}
      </ThemedText>
      {message && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {message}
        </ThemedText>
      )}
      {actionLabel && onAction && <Button title={actionLabel} variant="ghost" onPress={onAction} />}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  padded: {
    padding: Spacing.four,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
});
