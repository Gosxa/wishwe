import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { FeedErrorState } from '@/components/feed/feed-error-state';
import {
  CalendarClockIcon,
  ChevronLeftIcon,
  MapPinIcon,
  MessagesSquareIcon,
  StickyNoteIcon,
  UsersRoundIcon,
} from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { AvatarStack } from '@/components/ui/avatar-stack';
import { EventImage } from '@/components/ui/event-image';
import { EventTags } from '@/components/ui/event-tags';
import { LeaveEventDialog } from '@/components/ui/leave-event-dialog';
import { ParticipationButton } from '@/components/ui/participation-button';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useEventDetails } from '@/lib/events/use-event-details';
import { useEventParticipation } from '@/lib/events/use-event-participation';
import type { FeedEvent } from '@/lib/events/types';

const COVER_RATIO = 402 / 326;
const SHEET_OVERLAP = 66;
const MAX_VISIBLE_AVATARS = 3;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const { event, isLoading, error, retry, applyEvent } = useEventDetails(id);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();

      return;
    }

    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <EventImage
          uri={event?.image ?? null}
          style={{ width, height: Math.round(width / COVER_RATIO) }}
        />

        <View style={[styles.sheet, { marginTop: -SHEET_OVERLAP }]}>
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : error || !event ? (
            <FeedErrorState message={error ?? 'Failed to load this event'} onRetry={retry} />
          ) : (
            <EventDetails event={event} onChange={applyEvent} bottomInset={insets.bottom} />
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={goBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        style={({ pressed }) => [
          styles.back,
          { top: insets.top + Spacing.two },
          pressed && styles.pressed,
        ]}
      >
        <ChevronLeftIcon size={20} color={Colors.ink} />
      </Pressable>
    </View>
  );
}

type DetailsProps = {
  event: FeedEvent;
  onChange: (event: FeedEvent) => void;
  bottomInset: number;
};

function EventDetails({ event, onChange, bottomInset }: DetailsProps) {
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const participation = useEventParticipation(event, { onChange });

  const showChat = participation.isParticipating && Boolean(event.chatLink);

  const handleAction = () => {
    participation.clearError();

    if (participation.isParticipating) {
      setIsLeaveOpen(true);

      return;
    }

    void participation.join();
  };

  const handleLeave = async () => {
    if (await participation.leave()) {
      setIsLeaveOpen(false);
    }
  };

  const openChat = () => {
    if (event.chatLink) {
      void Linking.openURL(event.chatLink);
    }
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <EventTags type={event.type} hashtag={event.hashtag} />
      </View>

      <View style={styles.host}>
        <Avatar uri={event.host.avatar} size={16} />
        <Text style={styles.hostName}>{event.host.username}</Text>
        {event.host.mutualFriend ? (
          <>
            <View style={styles.dot} />
            <Text style={styles.hostMutual} numberOfLines={1}>
              friend of {event.host.mutualFriend}
            </Text>
          </>
        ) : null}
      </View>

      <View style={styles.row}>
        <StickyNoteIcon size={14} color={Colors.muted} />
        <Text style={styles.body}>
          {event.description || 'No details added by the host.'}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.factsRow}>
        <View style={styles.facts}>
          {event.date ? (
            <View style={styles.row}>
              <CalendarClockIcon size={14} color={Colors.muted} />
              <Text style={styles.body}>{event.date}</Text>
            </View>
          ) : null}
          {event.location ? (
            <View style={styles.row}>
              <MapPinIcon size={14} color={Colors.muted} />
              <Text style={styles.body}>{event.location}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.attendees}>
          <UsersRoundIcon size={14} color={Colors.muted} />
          {event.participantCount > 0 ? (
            <AvatarStack
              participants={event.participants}
              count={event.participantCount}
              maxVisible={MAX_VISIBLE_AVATARS}
            />
          ) : (
            <Text style={styles.muted}>
              {event.type === 'plan' ? 'Be the first to join' : 'No one interested yet'}
            </Text>
          )}
        </View>
      </View>

      {participation.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {participation.error}
        </Text>
      ) : null}

      <View style={[styles.actions, { paddingBottom: Math.max(bottomInset, Spacing.four) }]}>
        <ParticipationButton
          label={participation.isParticipating ? participation.selectedLabel : participation.actionLabel}
          selected={participation.isParticipating}
          pending={participation.isPending}
          height={48}
          onPress={handleAction}
          style={styles.action}
        />

        {showChat ? (
          <Pressable
            onPress={openChat}
            accessibilityRole="button"
            accessibilityLabel="Open chat"
            style={({ pressed }) => [styles.chat, pressed && styles.pressed]}
          >
            <MessagesSquareIcon size={20} color={Colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <LeaveEventDialog
        visible={isLeaveOpen}
        isPlan={event.type === 'plan'}
        isPending={participation.isPending}
        onCancel={() => {
          if (!participation.isPending) setIsLeaveOpen(false);
        }}
        onConfirm={handleLeave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    flexGrow: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
  centered: {
    paddingVertical: Spacing.six,
    alignItems: 'center',
  },
  back: {
    position: 'absolute',
    left: Spacing.three,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.ink,
  },
  host: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  hostName: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.ink,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.placeholder,
  },
  hostMutual: {
    flexShrink: 1,
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 19,
    color: Colors.muted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  body: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.hairline,
    marginVertical: Spacing.four,
  },
  factsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  facts: {
    flex: 1,
    gap: Spacing.two,
  },
  attendees: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  muted: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.placeholder,
  },
  error: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
    marginTop: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 'auto',
    paddingTop: Spacing.five,
  },
  action: {
    flex: 1,
  },
  chat: {
    width: 82,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
});
