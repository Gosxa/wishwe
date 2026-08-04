import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type Props = {
  size?: number;
  color?: string;
};

export function RequiredMarkIcon({ size = 14, color = Colors.error }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.9997 6V18M17.1957 9L6.80371 15M6.80371 9L17.1957 15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
