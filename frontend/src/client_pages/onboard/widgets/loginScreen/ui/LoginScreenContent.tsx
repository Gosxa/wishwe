import { HelperText } from '@/shared';
import s from './loginScreen.module.scss';

type Props = {
  onGoogle: () => void;
  onEmail: () => void;
  googleError: string;
};

export const LoginScreenContent = ({
  onGoogle,
  onEmail,
  googleError,
}: Props) => (
  <div className={s.wrapper}>
    <div className={s.googleWrapper}>
      <button className={s.google} onClick={onGoogle}>
        <span>Continue with Google G</span>
      </button>
      {!!googleError && <HelperText type="error" text={googleError} />}
    </div>
    <div className={s.spacer}>
      <span>or</span>
    </div>
    <button className={s.email} onClick={onEmail}>
      <span>Continue with email</span>
    </button>
  </div>
);
