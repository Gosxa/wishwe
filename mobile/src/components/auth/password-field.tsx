import { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';

import { TextField } from '@/components/auth/text-field';
import { EyeIcon } from '@/components/icons';
import { Spacing } from '@/constants/theme';

type Props = Omit<TextInputProps, 'secureTextEntry'> & {
  error?: string;
  helperText?: string;
};

export function PasswordField({ error, helperText, style, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        autoComplete="password"
        {...inputProps}
        error={error}
        helperText={helperText}
        secureTextEntry={!visible}
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
