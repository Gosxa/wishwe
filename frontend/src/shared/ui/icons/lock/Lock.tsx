type Props = {
  width?: number;
  height?: number;
};

export const Lock = ({ width = 16, height = 16 }: Props) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="2"
      y="7.33333"
      width="12"
      height="7.33333"
      rx="1.33333"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.66667 7.33333V4.66667C4.66667 3.78261 5.01786 2.93477 5.64298 2.30964C6.2681 1.68452 7.11595 1.33333 8 1.33333C8.88405 1.33333 9.7319 1.68452 10.357 2.30964C10.9821 2.93477 11.3333 3.78261 11.3333 4.66667V7.33333"
      stroke="currentColor"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
