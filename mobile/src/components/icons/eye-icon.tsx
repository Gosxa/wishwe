import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type Props = {
  open?: boolean;
  size?: number;
  color?: string;
};

export function EyeIcon({ open = false, size = 20, color = Colors.muted }: Props) {
  if (open) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <Path
          d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
          stroke={color}
          strokeWidth={1.6}
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 3l18 18M10.6 10.7a2.8 2.8 0 0 0 3.7 3.7M9.4 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-4.2 4.8M6.1 6.2A17.3 17.3 0 0 0 2 12s3.5 7 10 7c1.5 0 2.9-.3 4.1-.8"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
