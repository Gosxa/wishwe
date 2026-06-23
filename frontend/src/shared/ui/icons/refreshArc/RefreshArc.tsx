type Props = {
  className?: string;
};

export const RefreshArc = ({ className }: Props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient
        id="resendGrad"
        x1="1"
        y1="0.5"
        x2="0.5"
        y2="0"
        gradientUnits="objectBoundingBox"
      >
        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
        <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
      </linearGradient>
    </defs>
    <path
      d="M13.5 8A5.5 5.5 0 1 1 8 2.5"
      stroke="url(#resendGrad)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path d="M8 1v3l2-1.5L8 1Z" fill="currentColor" />
  </svg>
);
