import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = TextInputProps & {
  error?: string;
  helperText?: string;
  isSuccess?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  error,
  helperText,
  isSuccess = false,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        {...inputProps}
        placeholderTextColor={Colors.placeholder}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          focused && styles.focused,
          hasError && styles.error,
          isSuccess && !hasError && styles.success,
          style,
        ]}
      />
      {hasError ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, isSuccess && styles.successText]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 48,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 20,
    color: Colors.ink,
  },
  focused: {
    borderColor: Colors.primary,
  },
  error: {
    borderColor: Colors.error,
  },
  success: {
    borderColor: Colors.success,
  },
  helperText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.muted,
  },
  errorText: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
  },
  successText: {
    color: Colors.success,
  },
});
