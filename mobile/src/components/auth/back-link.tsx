import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
};

export function BackLink({ label, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      hitSlop={8}
    >
      <View style={styles.chevron} accessibilityElementsHidden>
        <Text style={styles.chevronText}>‹</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  pressed: {
    opacity: 0.65,
  },
  chevron: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    fontFamily: Fonts.regular,
    fontSize: 22,
    lineHeight: 24,
    color: Colors.ink,
    marginTop: -2,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink,
    textDecorationLine: 'underline',
  },
});
