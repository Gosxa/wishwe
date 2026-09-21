import { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

import { ChevronDownIcon } from '@/components/icons';
import { FeedSortSheet, type SortMenuAnchor } from '@/components/feed/feed-sort-sheet';
import {
  SegmentedControl,
  type SegmentedControlOption,
} from '@/components/ui/segmented-control';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import type { FeedFilter, FeedReach, SortOption } from '@/lib/events/types';

type Props = {
  filter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
  reach: FeedReach;
  onReachChange: (reach: FeedReach) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
};

const FILTERS: SegmentedControlOption<FeedFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'plans', label: 'Plans' },
  { value: 'wishes', label: 'Wishes' },
];

export function FeedToolbar({
  filter,
  onFilterChange,
  reach,
  onReachChange,
  sort,
  onSortChange,
}: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [anchor, setAnchor] = useState<SortMenuAnchor | null>(null);
  const sortRef = useRef<View>(null);

  const openSheet = () => {
    sortRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ top: y + height, right: Dimensions.get('window').width - (x + width) });
      setIsSheetOpen(true);
    });
  };

  return (
    <View style={styles.row}>
      <SegmentedControl
        options={FILTERS}
        value={filter}
        onChange={onFilterChange}
        selectedLabelStyle={styles.segmentedSelectedLabel}
      />

      <Pressable
        ref={sortRef}
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel="Sort and filter events"
        accessibilityState={{ expanded: isSheetOpen }}
        style={({ pressed }) => [styles.sort, pressed && styles.pressed]}
      >
        <Text style={styles.sortLabel}>Sort</Text>
        <ChevronDownIcon size={12} color={Colors.muted} />
      </Pressable>

      <FeedSortSheet
        visible={isSheetOpen}
        anchor={anchor}
        filter={filter}
        sort={sort}
        reach={reach}
        onSortChange={onSortChange}
        onReachChange={onReachChange}
        onClose={() => setIsSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  segmentedSelectedLabel: {
    letterSpacing: 0.32,
  },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingLeft: Spacing.two,
  },
  sortLabel: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.muted,
  },
});
