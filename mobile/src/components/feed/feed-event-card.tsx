import { StyleSheet, Text, View } from 'react-native';

import { EventCard } from '@/components/feed/event-card';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { confirmLeaveEvent } from '@/lib/events/leave-event-confirmation';
import { useEventParticipation } from '@/lib/events/use-event-participation';
import type { FeedEvent } from '@/lib/events/types';

type Props = {
  event: FeedEvent;
  onOpen: (event: FeedEvent) => void;
  onChange: (event: FeedEvent) => void;
};

export function FeedEventCard({ event, onOpen, onChange }: Props) {
  const participation = useEventParticipation(event, { onChange });
  const isPlan = event.type === 'plan';

  const handleLeave = async () => {
    if (!(await confirmLeaveEvent(isPlan))) {
      return;
    }

    await participation.leave();
  };

  const handleAction = () => {
    participation.clearError();

    if (participation.isParticipating) {
      void handleLeave();

      return;
    }

    void participation.join();
  };

  return (
    <View style={styles.root}>
      <EventCard
        event={event}
        isPending={participation.isPending}
        onPress={() => onOpen(event)}
        onAction={handleAction}
      />

      {participation.error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {participation.error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing.two,
  },
  error: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
  },
});
