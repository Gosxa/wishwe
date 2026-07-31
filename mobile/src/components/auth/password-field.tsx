import { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { TextField } from '@/components/auth/text-field';
import { Colors, Spacing } from '@/constants/theme';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  error?: string;
  helperText?: string;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
          stroke={Colors.muted}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Path
          d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
          stroke={Colors.muted}
          strokeWidth={1.6}
        />
      </Svg>
    );
  }

  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3l18 18M10.6 10.7a2.8 2.8 0 0 0 3.7 3.7M9.4 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.2 4.8M6.1 6.2A17.3 17.3 0 0 0 2 12s3.5 7 10 7c1.5 0 2.9-.3 4.1-.8"
        stroke={Colors.muted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PasswordField({ error, helperText, style, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextField
        {...inputProps}
        error={error}
        helperText={helperText}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        autoComplete="password"
        style={[styles.input, style]}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        hitSlop={8}
        style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
      >
        <EyeIcon open={visible} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  input: {
    paddingRight: 48,
  },
  toggle: {
    position: 'absolute',
    right: Spacing.three,
    top: 14,
    zIndex: 1,
  },
  togglePressed: {
    opacity: 0.6,
  },
});
