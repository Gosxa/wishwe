import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import type { ActivityItem } from '@/lib/activity/types';

type Props = {
  item: ActivityItem;
  onPress: (item: ActivityItem) => void;
};

export function ActivityItemRow({ item, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.message}. ${item.timeAgo}`}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.time}>{item.timeAgo}</Text>
    </Pressable>
  );
}

export function ActivitySeparator() {
  return (
    <View style={styles.separatorContainer}>
      <View style={styles.separatorLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  message: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.muted,
  },
  time: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.placeholder,
  },
  pressed: {
    opacity: 0.7,
  },
  separatorContainer: {
    height: 17,
    justifyContent: 'center',
  },
  separatorLine: {
    height: 1,
    backgroundColor: Colors.hairline,
  },
});
