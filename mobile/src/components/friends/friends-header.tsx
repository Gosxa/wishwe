import { StyleSheet, TextInput, View } from 'react-native';

import { SearchIcon } from '@/components/icons';
import { Logo } from '@/components/logo';
import { Colors, Fonts, Radii } from '@/constants/theme';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function FriendsHeader({ search, onSearchChange }: Props) {
  return (
    <View style={styles.row}>
      <Logo height={44} />
      <View style={styles.field}>
        <SearchIcon size={16} color={Colors.placeholder} />
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search friends"
          placeholderTextColor={Colors.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Search friends"
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
  },
  field: {
    flex: 1,
    height: 40,
    marginLeft: 31,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
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
