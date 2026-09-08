import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EventCard } from '@/components/feed/event-card';
import { LeaveEventDialog } from '@/components/ui/leave-event-dialog';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useEventParticipation } from '@/lib/events/use-event-participation';
import type { FeedEvent } from '@/lib/events/types';

type Props = {
  event: FeedEvent;
  onOpen: (event: FeedEvent) => void;
  onChange: (event: FeedEvent) => void;
};

export function FeedEventCard({ event, onOpen, onChange }: Props) {
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const participation = useEventParticipation(event, { onChange });

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

      <LeaveEventDialog
        visible={isLeaveOpen}
        isPlan={event.type === 'plan'}
        isPending={participation.isPending}
        onCancel={() => {
          if (!participation.isPending) setIsLeaveOpen(false);
        }}
        onConfirm={handleLeave}
      />
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
