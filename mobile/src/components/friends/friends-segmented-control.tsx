import { StyleSheet } from 'react-native';

import {
  SegmentedControl,
  type SegmentedControlOption,
} from '@/components/ui/segmented-control';

export type FriendsView = 'friends' | 'requests';

type Props = {
  value: FriendsView;
  onChange: (value: FriendsView) => void;
};

const OPTIONS: SegmentedControlOption<FriendsView>[] = [
  { value: 'friends', label: 'Your friends' },
  { value: 'requests', label: 'Requests' },
];

export function FriendsSegmentedControl({ value, onChange }: Props) {
  return (
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      style={styles.control}
    />
  );
}

const styles = StyleSheet.create({
  control: {
    marginTop: 32,
  },
});
