import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
};

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function Segmented<T extends string>({ options, value, onChange, label, style }: SegmentedProps<T>) {
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <ThemedText type="smallBold" themeColor="textSecondary">
          {label}
        </ThemedText>
      )}
      <View
        accessibilityRole="tablist"
        style={[styles.track, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {options.map((option) => {
          const selected = option.value === value;
          const color = selected ? theme.onPrimary : theme.textSecondary;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && { backgroundColor: theme.primary },
                pressed && !selected && { backgroundColor: theme.backgroundSelected },
              ]}>
              {option.icon && <Icon name={option.icon} size={16} color={color} />}
              <ThemedText type="smallBold" numberOfLines={1} style={{ color }}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one,
  },
  track: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.one,
    gap: Spacing.one,
  },
  option: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
  },
});
