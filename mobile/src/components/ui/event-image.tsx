import { useState } from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const FALLBACK = require('../../../assets/images/event-cover-fallback.webp');

type Props = {
  uri: string | null;
  style?: StyleProp<ImageStyle>;
};

export function EventImage({ uri, style }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <Image
      source={uri && !failed ? { uri } : FALLBACK}
      onError={() => setFailed(true)}
      resizeMode="cover"
      style={style}
      accessibilityIgnoresInvertColors
    />
  );
}
