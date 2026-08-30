import s from './spinner.module.scss';

type Props = {
  fullscreen?: boolean;
  inline?: boolean;
  compact?: boolean;
  small?: boolean;
};

const rootClass = ({ fullscreen, inline, compact, small }: Props) => {
  const base = inline
    ? s.inline
    : fullscreen
      ? `${s.backdrop} ${s.fullscreen}`
      : s.backdrop;

  return [base, compact && s.responsive, small && s.small]
    .filter(Boolean)
    .join(' ');
};

export const Spinner = ({
  fullscreen = false,
  inline = false,
  compact = false,
  small = false,
}: Props) => (
  <div
    className={rootClass({ fullscreen, inline, compact, small })}
    role="status"
    aria-label="Loading"
  >
    <div className={s.wrapper}>
      <svg className={s.svg} viewBox="0 0 80 80" fill="none">
        <circle
          className={s.circle}
          cx="40"
          cy="40"
          r="36"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>
      <span className={s.label}>Loading...</span>
    </div>
    {compact && (
      <div className={s.dots} aria-hidden="true">
        <span className={s.dot} />
        <span className={s.dot} />
        <span className={s.dot} />
      </div>
    )}
  </div>
);
