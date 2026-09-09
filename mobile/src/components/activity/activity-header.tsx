import { StyleSheet, TextInput, View } from 'react-native';

import { SearchIcon } from '@/components/icons';
import { Logo } from '@/components/logo';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onSubmitSearch?: () => void;
};

export function ActivityHeader({
  search,
  onSearchChange,
  onSubmitSearch,
}: Props) {
  return (
    <View style={styles.row}>
      <Logo height={44} />

      <View style={styles.field}>
        <SearchIcon size={16} color={Colors.placeholder} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          onSubmitEditing={onSubmitSearch}
          placeholder="Search events"
          placeholderTextColor={Colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search events"
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    height: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  input: {
    flex: 1,
    padding: 0,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink,
  },
});
