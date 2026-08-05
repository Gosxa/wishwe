import { Pressable, StyleSheet, Text, View } from 'react-native';
import { openURL } from 'expo-linking';

import { Colors, Fonts, Spacing } from '@/constants/theme';
import { TERMS_OF_USE_URL } from '@/constants/legal';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function TermsCheckbox({ value, onChange, disabled = false }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(!value)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityLabel="I agree to the Terms of Use"
        accessibilityState={{ checked: value, disabled }}
        style={styles.toggle}
        hitSlop={Spacing.two}
      >
        <View style={[styles.box, value && styles.boxChecked]}>
          {value ? <Text style={styles.check}>✓</Text> : null}
        </View>
        <Text style={styles.label}>I agree to the</Text>
      </Pressable>
      <Text
        style={[styles.label, styles.link]}
        accessibilityRole="link"
        onPress={() => openURL(TERMS_OF_USE_URL)}
        suppressHighlighting
      >
        Terms of Use
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  box: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  check: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    lineHeight: 16,
    color: Colors.cream,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22.4,
    color: Colors.muted,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
