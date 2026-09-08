import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import type { ParticipantAvatar } from '@/lib/events/types';

type Props = {
  participants: ParticipantAvatar[];
  count: number;
  size?: number;
  maxVisible?: number;
};

export function AvatarStack({ participants, count, size = 32, maxVisible = 3 }: Props) {
  const shown = participants.slice(0, maxVisible);
  const extra = shown.length < maxVisible ? 0 : Math.max(0, count - maxVisible);

  if (shown.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {shown.map((participant, index) => (
        <Avatar
          key={`${participant.username}-${index}`}
          uri={participant.avatar}
          size={size}
          style={[styles.avatar, index > 0 && { marginLeft: -Spacing.one }]}
        />
      ))}
      {extra > 0 ? (
        <View
          style={[
            styles.extra,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -Spacing.one },
          ]}
        >
          <Text style={styles.extraLabel}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 1,
    borderColor: Colors.cream,
  },
  extra: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  extraLabel: {
    fontFamily: Fonts.regular,
    fontSize: 10,
    lineHeight: 16,
    color: Colors.muted,
  },
});
