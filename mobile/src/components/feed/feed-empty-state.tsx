import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import type { FeedFilter } from '@/lib/events/types';

type Props = {
  filter: FeedFilter;
  hasSearch: boolean;
};

const COPY: Record<FeedFilter, { title: string; subtitle: string }> = {
  all: {
    title: 'Waiting for adventures?',
    subtitle: 'Invite your friends to see their plans here, or start your own right now.',
    },
  plans: {
    title: 'It is a bit quiet here',
    subtitle: 'Your calendar is empty. Invite friends to see what they are up to.',
  },
  wishes: {
    title: 'No wishes yet',
    subtitle: 'Share your dreams or invite friends to see theirs.',
  },
};

export function FeedEmptyState({ filter, hasSearch }: Props) {
  const { title, subtitle } = hasSearch
    ? {
        title: 'Nothing matches that search',
        subtitle: 'Try a different word, or clear the search to see everything again.',
      }
    : COPY[filter];

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    lineHeight: 25,
    color: Colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.muted,
    textAlign: 'center',
  },
});
