type Props = {
  size?: number;
};

export const InfoCircle = ({ size = 16 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 7.4V11.6M8 4.4V4.7M14.6 8C14.6 11.65 11.65 14.6 8 14.6C4.35 14.6 1.4 11.65 1.4 8C1.4 4.35 4.35 1.4 8 1.4C11.65 1.4 14.6 4.35 14.6 8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
