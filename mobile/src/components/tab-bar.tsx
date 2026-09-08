import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BellIcon, HouseIcon, PlusIcon, SmileIcon, type IconProps } from '@/components/icons';
import { Avatar } from '@/components/ui/avatar';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

export type TabBarItem = {
  name: string;
  label: string;
  isFocused: boolean;
  onPress: () => void;
};

type Props = {
  items: TabBarItem[];
  avatarUri: string | null;
};

const ICONS: Record<string, (props: IconProps) => ReactElement> = {
  index: HouseIcon,
  friends: SmileIcon,
  activity: BellIcon,
};

const CREATE_TAB = 'create';
const PROFILE_TAB = 'profile';

export function TabBar({ items, avatarUri }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, Spacing.two) }]}>
      <View style={styles.items}>
        {items.map((item) => {
          if (item.name === CREATE_TAB) {
            return (
              <Pressable
                key={item.name}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: item.isFocused }}
                style={({ pressed }) => [styles.create, pressed && styles.pressed]}
              >
                <PlusIcon size={16} color={Colors.cream} />
              </Pressable>
            );
          }

          const Icon = ICONS[item.name];
          const tint = item.isFocused ? Colors.primary : Colors.placeholder;

          return (
            <Pressable
              key={item.name}
              onPress={item.onPress}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: item.isFocused }}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <View style={styles.icon}>
                {item.name === PROFILE_TAB ? (
                  <Avatar
                    uri={avatarUri}
                    size={24}
                    style={item.isFocused ? styles.avatarFocused : undefined}
                  />
                ) : Icon ? (
                  <Icon size={24} color={tint} />
                ) : null}
              </View>
              <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    backgroundColor: Colors.cream,
    paddingTop: Spacing.two,
  },
  items: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 34,
  },
  tab: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.one,
  },
  icon: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFocused: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  create: {
    width: 48,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.sm,
    backgroundColor: Colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
