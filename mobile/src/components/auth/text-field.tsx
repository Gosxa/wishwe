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

import { RequiredMarkIcon } from '@/components/icons';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  isSuccess?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  required = false,
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
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <RequiredMarkIcon /> : null}
        </View>
      ) : null}
      <TextInput
        {...inputProps}
        accessibilityLabel={
          inputProps.accessibilityLabel ??
          (label ? `${label}${required ? ', required' : ''}` : undefined)
        }
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.one,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink,
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
