type Props = {
  size?: number;
};

export const WifiOff = ({ size = 16 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.8 5.4C5 1 11 1 15.2 5.4M3.8 8.6C6.3 6.1 9.7 6.1 12.2 8.6M8 12.2V12.5M1.4 14.6L14.6 1.4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
