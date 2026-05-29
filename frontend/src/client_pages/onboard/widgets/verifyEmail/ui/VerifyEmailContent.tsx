import {
  RefObject,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';
import { HelperText } from '@shared/ui/helperText/HelperText';
import { ChevronLeft } from '@shared/ui/icons';
import s from './verifyEmail.module.scss';

type CellsConfig = {
  values: string[];
  inputRefs: RefObject<(HTMLInputElement | null)[]>;
  onChange: (i: number, e: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (i: number, e: KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
  hasError: boolean;
};

type SubmitConfig = {
  onSubmit: () => void;
  error?: string;
};

type BackConfig = {
  onBack: () => void;
};

type Props = {
  cells: CellsConfig;
  submit: SubmitConfig;
  back: BackConfig;
};

const inputParams = {
  type: 'text',
  inputMode: 'numeric',
  maxLength: 1,
} as const;

export const VerifyEmailContent = ({ cells, submit, back }: Props) => (
  <div className={s.wrapper}>
    <div className={s.cells}>
      {cells.values.map((val, i) => (
        <input
          key={i}
          ref={el => {
            // eslint-disable-next-line no-param-reassign
            cells.inputRefs.current[i] = el;
          }}
          className={s.cell}
          {...inputParams}
          data-filled={!!val}
          data-error={cells.hasError}
          value={val}
          onChange={e => cells.onChange(i, e)}
          onKeyDown={e => cells.onKeyDown(i, e)}
          onPaste={cells.onPaste}
        />
      ))}
    </div>
    <div className={s.verifyWrapper}>
      <button className={s.verify} onClick={submit.onSubmit}>
        <span>Verify code</span>
      </button>
      {submit.error && <HelperText type="error" text={submit.error} />}
    </div>
    <button className={s.back} onClick={back.onBack}>
      <ChevronLeft />
      <span>Change email</span>
    </button>
  </div>
);
