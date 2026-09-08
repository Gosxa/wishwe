import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RefreshIcon } from '@/components/icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = {
  message: string;
  onRetry: () => void;
};

export function FeedErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
      >
        <RefreshIcon size={16} color={Colors.primary} />
        <Text style={styles.retryLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.muted,
    textAlign: 'center',
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  retryLabel: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.32,
    color: Colors.primary,
  },
});
