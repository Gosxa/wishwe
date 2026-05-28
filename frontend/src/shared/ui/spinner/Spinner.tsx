import s from './spinner.module.scss';

export const Spinner = () => (
  <div className={s.backdrop}>
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
