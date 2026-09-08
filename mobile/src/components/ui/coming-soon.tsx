import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = {
  title: string;
  description?: string;
};

export function ComingSoon({
  title,
  description = 'This part of WishWe is still under development. It will land in a future update.',
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.five }]}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>coming soon</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    maxWidth: 320,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.ink,
    backgroundColor: Colors.accentYellow,
    borderStyle: 'dashed',
    marginBottom: Spacing.two,
  },
  badgeLabel: {
    fontFamily: Fonts.accent,
    fontSize: 16,
    lineHeight: 16,
    color: Colors.ink,
    includeFontPadding: false,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.ink,
    textAlign: 'center',
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.muted,
    textAlign: 'center',
  },
});
