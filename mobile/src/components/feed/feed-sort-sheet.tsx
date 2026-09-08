import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Keyframe } from 'react-native-reanimated';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { FeedFilter, FeedReach, SortOption } from '@/lib/events/types';

export type SortMenuAnchor = { top: number; right: number };

type Props = {
  visible: boolean;
  anchor: SortMenuAnchor | null;
  filter: FeedFilter;
  sort: SortOption;
  reach: FeedReach;
  onSortChange: (sort: SortOption) => void;
  onReachChange: (reach: FeedReach) => void;
  onClose: () => void;
};


const menuEnter = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -6 }, { scale: 0.96 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
}).duration(180);

const SORTS: { key: SortOption; label: string }[] = [
  { key: 'recent', label: 'Recently added' },
  { key: 'soonest', label: 'Soonest first' },
  { key: 'heat', label: 'Social heat' },
];

const REACHES: { key: FeedReach; label: string }[] = [
  { key: 'all', label: 'All updates' },
  { key: 'direct', label: 'Only direct friends' },
];

const RADIO_SELECTED = '#495136';
const RADIO_UNSELECTED = '#99998F';

export function FeedSortSheet({
  visible,
  anchor,
  filter,
  sort,
  reach,
  onSortChange,
  onReachChange,
  onClose,
}: Props) {
  const sorts = filter === 'all' ? SORTS.filter((option) => option.key !== 'heat') : SORTS;

  if (!visible || !anchor) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.dismissArea}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />
      <Animated.View
        entering={menuEnter}
        style={[styles.menu, { top: anchor.top + Spacing.one, right: anchor.right }]}
        accessibilityViewIsModal
      >
        <View style={styles.section}>
          <Text style={styles.legend}>Sort</Text>
          {sorts.map((option) => (
            <SheetOption
              key={option.key}
              label={option.label}
              selected={sort === option.key}
              selectedLabelColor={Colors.primary}
              onPress={() => {
                onSortChange(option.key);
                onClose();
              }}
            />
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.legend}>Show</Text>
          {REACHES.map((option) => (
            <SheetOption
              key={option.key}
              label={option.label}
              selected={reach === option.key}
              onPress={() => {
                onReachChange(option.key);
                onClose();
              }}
            />
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

type OptionProps = {
  label: string;
  selected: boolean;
  selectedLabelColor?: string;
  onPress: () => void;
};

function SheetOption({ label, selected, selectedLabelColor, onPress }: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={[styles.optionLabel, selected && selectedLabelColor ? { color: selectedLabelColor } : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dismissArea: StyleSheet.absoluteFill,
  menu: {
    position: 'absolute',
    minWidth: 220,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.lg,
    padding: 12,
    gap: Spacing.two,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  section: {
    width: '100%',
    gap: Spacing.one,
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: Colors.hairline,
  },
  legend: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.ink,
  },
  option: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
  },
  optionSelected: {
    backgroundColor: Colors.creamMuted,
    borderRadius: Radii.sm,
  },
  optionPressed: {
    opacity: 0.75,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: RADIO_UNSELECTED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderWidth: 0,
    backgroundColor: RADIO_SELECTED,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  optionLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.muted,
  },
});
