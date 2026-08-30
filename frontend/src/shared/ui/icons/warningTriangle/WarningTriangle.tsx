type Props = {
  size?: number;
};

export const WarningTriangle = ({ size = 16 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 6.2V9.8M8 11.6V11.9M8 1.6L15.2 14.4H0.8L8 1.6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
