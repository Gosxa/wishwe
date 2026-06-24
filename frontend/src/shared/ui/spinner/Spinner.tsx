import s from './spinner.module.scss';

type Props = {
  fullscreen?: boolean;
  inline?: boolean;
};

const rootClass = ({ fullscreen, inline }: Props) => {
  if (inline) return s.inline;

  return fullscreen ? `${s.backdrop} ${s.fullscreen}` : s.backdrop;
};

export const Spinner = ({ fullscreen = false, inline = false }: Props) => (
  <div className={rootClass({ fullscreen, inline })}>
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
  </div>
);
