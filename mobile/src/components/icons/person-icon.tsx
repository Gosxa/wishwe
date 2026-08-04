import Svg, { Circle, Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type Props = {
  size?: number;
  color?: string;
};

export function PersonIcon({ size = 40, color = Colors.placeholder }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.6} />
      <Path
        d="M4 20c0-3.6 3.6-6 8-6s8 2.4 8 6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
