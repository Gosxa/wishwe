import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PlusIcon } from '@/components/icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  selected: boolean;
  pending?: boolean;
  height?: number;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ParticipationButton({
  label,
  selected,
  pending = false,
  height = 44,
  onPress,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected, busy: pending, disabled: pending }}
      style={({ pressed }) => [
        styles.button,
        { height },
        selected && styles.selected,
        pressed && !pending && styles.pressed,
        pending && styles.pending,
        style,
      ]}
    >
      {pending ? (
        <ActivityIndicator color={Colors.primary} />
      ) : (
        <View style={styles.content}>
          {!selected ? <PlusIcon size={16} color={Colors.primary} /> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.three,
  },
  selected: {
    backgroundColor: Colors.primaryTint,
  },
  pressed: {
    opacity: 0.7,
  },
  pending: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.32,
    color: Colors.primary,
    textAlign: 'center',
  },
});
