type Props = {
  size?: number;
};

export const Navigation = ({ size = 16 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20.4 4.06 4.42 9.72c-1.13.4-1.06 2.02.1 2.32l6.06 1.55a1.5 1.5 0 0 1 1.08 1.08l1.55 6.06c.3 1.16 1.92 1.23 2.32.1L21.2 4.85a.6.6 0 0 0-.77-.78Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
