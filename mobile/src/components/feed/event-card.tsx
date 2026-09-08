import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CalendarClockIcon, MapPinIcon } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { EventImage } from '@/components/ui/event-image';
import { EventTags } from '@/components/ui/event-tags';
import { ParticipationButton } from '@/components/ui/participation-button';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { FeedEvent } from '@/lib/events/types';

type Props = {
  event: FeedEvent;
  isPending: boolean;
  onPress: () => void;
  onAction: () => void;
};

export function EventCard({ event, isPending, onPress, onAction }: Props) {
  const isParticipating = event.userParticipationStatus !== null;
  const actionLabel = event.type === 'plan' ? 'Join' : 'Interested';
  const selectedLabel = event.type === 'plan' ? 'Joined' : 'Interested';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${event.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.media}>
        <EventImage uri={event.image} style={styles.image} />
        <EventTags type={event.type} hashtag={event.hashtag} style={styles.tags} />
      </View>

      <View style={styles.body}>
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          <View style={styles.meta}>
            <View style={styles.metaRow}>
              <Avatar uri={event.host.avatar} size={16} />
              <Text style={styles.host} numberOfLines={1}>
                {event.host.username}
              </Text>
            </View>

            {event.date ? (
              <View style={styles.metaRow}>
                <CalendarClockIcon size={12} color={Colors.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.date}
                </Text>
              </View>
            ) : null}

            {event.location ? (
              <View style={styles.metaRow}>
                <MapPinIcon size={12} color={Colors.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <ParticipationButton
          label={isParticipating ? selectedLabel : actionLabel}
          selected={isParticipating}
          pending={isPending}
          onPress={onAction}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
  media: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 178 / 152,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  tags: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    right: Spacing.two,
    flexWrap: 'wrap',
  },
  body: {
    width: 177,
    gap: Spacing.four,
    justifyContent: 'flex-start',
  },
  details: {
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.16,
    color: Colors.ink,
  },
  meta: {
    gap: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  host: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 10,
    lineHeight: 16,
    color: Colors.ink,
  },
  metaText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 10,
    lineHeight: 16,
    color: Colors.muted,
  },
});
