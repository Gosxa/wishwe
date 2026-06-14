import { HelperText } from '../helperText/HelperText';
import s from './toggle.module.scss';

type Props = {
  id: string;
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  helperText?: string;
  disabled?: boolean;
};

export const Toggle = ({
  id,
  label,
  checked,
  onChange,
  helperText,
  disabled = false,
}: Props) => (
  <div className={s.wrapper}>
    <label className={s.choice} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className={s.input}
      />
      <span className={s.track}>
        <span className={s.thumb} />
      </span>
      {label && <span className={s.label}>{label}</span>}
    </label>
    {helperText && <HelperText text={helperText} type="info" inline />}
  </div>
);
