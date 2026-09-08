import WishWeLogo from '../../Logo.svg';

type Props = { height?: number };

export function Logo({ height = 44 }: Props) {
  return (
    <WishWeLogo
      width={Math.round((height * 66) / 44)}
      height={height}
      accessibilityLabel="WishWe"
      accessibilityRole="image"
    />
  );
}
