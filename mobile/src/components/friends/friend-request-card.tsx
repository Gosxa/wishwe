import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Colors, Fonts, Radii } from '@/constants/theme';
import type { FriendRequest } from '@/lib/friends/types';

type Props = {
  request: FriendRequest;
  pendingAction: 'accept' | 'decline' | null;
  onAccept: (request: FriendRequest) => void;
  onDecline: (request: FriendRequest) => void;
};

export function FriendRequestCard({
  request,
  pendingAction,
  onAccept,
  onDecline,
}: Props) {
  const disabled = pendingAction !== null;

  return (
    <View style={styles.card}>
      <View style={styles.identity}>
        <Avatar uri={request.avatarUri} size={48} />
        <Text numberOfLines={1} style={styles.username}>
          @{request.username}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.actions}>
        <Pressable
          onPress={() => onAccept(request)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Accept request from ${request.username}`}
          accessibilityState={{ disabled, busy: pendingAction === 'accept' }}
          style={({ pressed }) => [
            styles.button,
            styles.accept,
            pressed && styles.pressed,
          ]}
        >
          {pendingAction === 'accept' ? (
            <ActivityIndicator color={Colors.cream} />
          ) : (
            <Text style={[styles.buttonLabel, styles.acceptLabel]}>Accept</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => onDecline(request)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Decline request from ${request.username}`}
          accessibilityState={{ disabled, busy: pendingAction === 'decline' }}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          {pendingAction === 'decline' ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={styles.buttonLabel}>Decline</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 120,
    padding: 8,
    gap: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderRadius: Radii.sm,
    backgroundColor: Colors.creamMuted,
  },
  identity: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  username: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.hairline,
  },
  actions: {
    width: 192,
    height: 40,
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
  },
  accept: {
    backgroundColor: Colors.primary,
  },
  buttonLabel: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    color: Colors.primary,
  },
  acceptLabel: {
    color: Colors.cream,
  },
  pressed: {
    opacity: 0.7,
  },
});
