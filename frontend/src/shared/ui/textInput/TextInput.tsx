import s from './textInput.module.scss';

type Props = {
  id: string;
  label: string;
  placeholder: string;
  required?: boolean;
};

export const TextInput = ({
  id,
  label,
  placeholder,
  required = false,
}: Props) => {
  return (
    <div className={s.wrapper}>
      <label htmlFor={id}>{label}</label>
      <input id={id} placeholder={placeholder} required={required} />
      <span />
    </div>
  );
};
