import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, loading = false, disabled = false, style }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.cream} />
      ) : (
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  pressed: {
    backgroundColor: Colors.primaryDark,
    opacity: 0.92,
  },
  disabled: {
    backgroundColor: Colors.primaryDisabled,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.32,
    color: Colors.cream,
    textAlign: 'center',
  },
  labelDisabled: {
    color: Colors.placeholder,
  },
});
