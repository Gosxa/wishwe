import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { EventType } from '@/lib/events/types';

type Props = {
  type?: EventType;
  hashtag?: string;
  style?: StyleProp<ViewStyle>;
};

export function EventTags({ type, hashtag, style }: Props) {
  if (!type && !hashtag) {
    return null;
  }

  return (
    <View style={[styles.row, style]}>
      {type ? (
        <View style={[styles.tag, type === 'plan' ? styles.plan : styles.wish]}>
          <Text style={styles.label} numberOfLines={1}>
            {type}
          </Text>
        </View>
      ) : null}
      {hashtag ? (
        <View style={[styles.tag, styles.hashtag]}>
          <Text style={styles.label} numberOfLines={1}>
            {hashtag}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tag: {
    flexShrink: 0,
    maxWidth: '100%',
    paddingHorizontal: 12,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  plan: {
    backgroundColor: Colors.accentPurple,
  },
  wish: {
    backgroundColor: Colors.accentYellow,
    borderStyle: 'dashed',
  },
  hashtag: {
    backgroundColor: Colors.cream,
  },
  label: {
    fontFamily: Fonts.accent,
    fontSize: 16,
    lineHeight: 16,
    color: Colors.ink,
    includeFontPadding: false,
  },
});
