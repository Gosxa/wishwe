import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

export type SegmentedControlOption<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  selectedLabelStyle?: StyleProp<TextStyle>;
};

type OptionLayout = { x: number; width: number };

// Spring physics for the selection pill as it slides and resizes between
// options. `damping` controls how much it bounces (lower = bouncier),
// `stiffness` controls how quickly it reaches the target, `mass` adds inertia.
const PILL_SPRING = { damping: 18, stiffness: 190, mass: 0.6 } as const;

// Duration-based timing for the label crossfade and the pill's initial fade-in.
const LABEL_TIMING = { duration: 180 } as const;

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
  selectedLabelStyle,
}: Props<T>) {
  const [layouts, setLayouts] = useState<Partial<Record<T, OptionLayout>>>({});
  const settled = useRef(false);
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const pillOpacity = useSharedValue(0);
  const selectedIndex = useSharedValue(
    options.findIndex((option) => option.value === value),
  );

  useEffect(() => {
    const layout = layouts[value];
    if (!layout) return;

    if (settled.current) {
      pillX.value = withSpring(layout.x, PILL_SPRING);
      pillWidth.value = withSpring(layout.width, PILL_SPRING);
    } else {
      settled.current = true;
      pillX.value = layout.x;
      pillWidth.value = layout.width;
      pillOpacity.value = withTiming(1, LABEL_TIMING);
    }
  }, [layouts, pillOpacity, pillWidth, pillX, value]);

  useEffect(() => {
    selectedIndex.value = withTiming(
      options.findIndex((option) => option.value === value),
      LABEL_TIMING,
    );
  }, [options, selectedIndex, value]);

  const handleLayout = (option: T) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;

    setLayouts((current) => {
      const previous = current[option];
      if (previous && previous.x === x && previous.width === width) {
        return current;
      }
      return { ...current, [option]: { x, width } };
    });
  };

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillOpacity.value,
    width: pillWidth.value,
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View style={[styles.row, style]} accessibilityRole="tablist">
      <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]} />

      {options.map((option, index) => (
        <SegmentedOption
          key={option.value}
          index={index}
          label={option.label}
          selected={option.value === value}
          selectedIndex={selectedIndex}
          selectedLabelStyle={selectedLabelStyle}
          onLayout={handleLayout(option.value)}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

type OptionProps = {
  index: number;
  label: string;
  selected: boolean;
  selectedIndex: SharedValue<number>;
  selectedLabelStyle?: StyleProp<TextStyle>;
  onLayout: (event: LayoutChangeEvent) => void;
  onPress: () => void;
};

function SegmentedOption({
  index,
  label,
  selected,
  selectedIndex,
  selectedLabelStyle,
  onLayout,
  onPress,
}: OptionProps) {
  const distance = useAnimatedStyle(() => {
    const value = Math.min(1, Math.abs(selectedIndex.value - index));
    return { opacity: 1 - value };
  });
  const inverse = useAnimatedStyle(() => {
    const value = Math.min(1, Math.abs(selectedIndex.value - index));
    return { opacity: value };
  });

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.option, pressed && styles.pressed]}
    >
      <Animated.View pointerEvents="none" style={[styles.outline, inverse]} />

      <Text
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[
          styles.label,
          styles.selectedLabel,
          selectedLabelStyle,
          styles.sizer,
        ]}
      >
        {label}
      </Text>

      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[styles.overlay, inverse]}
      >
        <Text style={styles.label}>{label}</Text>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[styles.overlay, distance]}
      >
        <Text style={[styles.label, styles.selectedLabel, selectedLabelStyle]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primary,
  },
  option: {
    height: 36,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
  },
  outline: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderColor: Colors.creamMuted,
    borderRadius: Radii.sm,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizer: {
    opacity: 0,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.muted,
  },
  selectedLabel: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    color: Colors.cream,
  },
  pressed: {
    opacity: 0.7,
  },
});
