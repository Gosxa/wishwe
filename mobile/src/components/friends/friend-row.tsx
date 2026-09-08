import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import UnfriendIcon from '@/assets/icons/unfriend.svg';
import { Avatar } from '@/components/ui/avatar';
import { Colors, Fonts, Radii } from '@/constants/theme';
import type { Friend } from '@/lib/friends/types';

type Props = {
  friend: Friend;
  isPending: boolean;
  onRemove: (friend: Friend) => void;
};

export function FriendRow({ friend, isPending, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.identity}>
        <Avatar uri={friend.avatarUri} size={48} />
        <Text numberOfLines={1} style={styles.username}>
          @{friend.username}
        </Text>
      </View>

      <Pressable
        onPress={() => onRemove(friend)}
        disabled={isPending}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${friend.username} from friends`}
        accessibilityState={{ disabled: isPending, busy: isPending }}
        hitSlop={6}
        style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
      >
        {isPending ? (
          <ActivityIndicator size="small" color={Colors.muted} />
        ) : (
          <UnfriendIcon width={19.2} height={19.2} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  identity: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginRight: 16,
  },
  username: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.ink,
  },
  remove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
  },
  pressed: {
    opacity: 0.6,
  },
});
