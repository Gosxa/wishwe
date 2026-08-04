import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { PersonIcon } from '@/components/icons';
import { Colors, Fonts, Spacing } from '@/constants/theme';

const SIZE = 96;

type Props = {
  uri: string | null;
  onPick: () => void;
  onRemove: () => void;
  disabled?: boolean;
  error?: string;
};

export function AvatarPicker({ uri, onPick, onRemove, disabled = false, error }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circleWrap}>
        <Pressable
          onPress={onPick}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={uri ? 'Change photo' : 'Add photo'}
          style={({ pressed }) => [styles.circle, pressed && !disabled && styles.pressed]}
        >
          {uri ? (
            <Image source={{ uri }} style={styles.image} accessibilityIgnoresInvertColors />
          ) : (
            <PersonIcon />
          )}
        </Pressable>

        {uri ? (
          <Pressable
            onPress={onRemove}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            hitSlop={8}
            style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
          >
            <Text style={styles.removeLabel}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onPick}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={uri ? 'Change photo' : 'Add photo'}
        style={({ pressed }) => [styles.action, pressed && !disabled && styles.pressed]}
      >
        <Text style={styles.actionLabel}>{uri ? 'Change photo' : 'Add photo'}</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  circleWrap: {
    position: 'relative',
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.creamMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pressed: {
    opacity: 0.7,
  },
  remove: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeLabel: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: Colors.cream,
  },
  action: {
    paddingVertical: Spacing.one,
  },
  actionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  error: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'center',
  },
});
