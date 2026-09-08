import { useState } from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PersonIcon } from '@/components/icons';
import { Colors } from '@/constants/theme';

type Props = {
  uri: string | null | undefined;
  size: number;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({ uri, size, style }: Props) {
  const [failed, setFailed] = useState(false);

  const frame = { width: size, height: size, borderRadius: size / 2 };

  if (!uri || failed) {
    return (
      <View style={[styles.fallback, frame, style]}>
        <PersonIcon size={Math.round(size * 0.66)} color={Colors.placeholder} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setFailed(true)}
      style={[styles.image, frame, style] as StyleProp<ImageStyle>}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.creamMuted,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.creamMuted,
  },
});
