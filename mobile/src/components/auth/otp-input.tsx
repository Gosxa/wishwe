import { useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

const CODE_LENGTH = 6;

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  hasError?: boolean;
  autoFocus?: boolean;
};

export function OtpInput({ value, onChange, hasError = false, autoFocus = true }: Props) {
  const refs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const focus = (index: number) => {
    const clamped = Math.max(0, Math.min(index, CODE_LENGTH - 1));
    refs.current[clamped]?.focus();
  };

  const setDigit = (index: number, digit: string) => {
    const next = [...value];
    next[index] = digit;
    onChange(next);
  };

  const applyDigits = (raw: string, startIndex = 0) => {
    const digits = raw.replace(/\D/g, '').slice(0, CODE_LENGTH - startIndex);
    if (!digits) return;

    const next = [...value];
    digits.split('').forEach((d, i) => {
      next[startIndex + i] = d;
    });
    onChange(next);
    focus(Math.min(startIndex + digits.length, CODE_LENGTH - 1));
  };

  const onChangeText = (index: number, text: string) => {
    if (text.length > 1) {
      applyDigits(text, index);
      return;
    }

    const digit = text.replace(/\D/g, '').slice(-1);
    setDigit(index, digit);
    if (digit && index < CODE_LENGTH - 1) {
      focus(index + 1);
    }
  };

  const onKeyPress = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key !== 'Backspace') return;

    if (value[index]) {
      setDigit(index, '');
    } else if (index > 0) {
      setDigit(index - 1, '');
      focus(index - 1);
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length: CODE_LENGTH }, (_, index) => {
        const filled = Boolean(value[index]);
        const focused = focusedIndex === index;

        return (
          <TextInput
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            value={value[index] ?? ''}
            onChangeText={(text) => onChangeText(index, text)}
            onKeyPress={(e) => onKeyPress(index, e)}
            onFocus={() => setFocusedIndex(index)}
            autoFocus={autoFocus && index === 0}
            keyboardType="number-pad"
            textContentType={index === 0 ? 'oneTimeCode' : 'none'}
            autoComplete={index === 0 ? (Platform.OS === 'android' ? 'sms-otp' : 'one-time-code') : 'off'}
            maxLength={CODE_LENGTH}
            selectTextOnFocus
            caretHidden={filled}
            accessibilityLabel={`Digit ${index + 1} of ${CODE_LENGTH}`}
            style={[
              styles.cell,
              focused && styles.focused,
              filled && styles.filled,
              hasError && styles.error,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  cell: {
    flex: 1,
    minHeight: 52,
    maxWidth: 56,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    fontSize: 18,
    lineHeight: 22,
    color: Colors.ink,
    paddingVertical: Spacing.two,
  },
  focused: {
    borderColor: Colors.primary,
  },
  filled: {
    borderColor: Colors.ink,
  },
  error: {
    borderColor: Colors.error,
  },
});
