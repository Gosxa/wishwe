import { HelperText } from '@/shared';
import { RefreshArc } from '@shared/ui/icons';
import s from './verifyEmail.module.scss';

const formatTime = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

type Props = {
  seconds: number;
  onResend: () => void;
  error?: string;
};

export const ResendButton = ({ seconds, onResend, error }: Props) => (
  <div className={s.resend}>
    {seconds > 0 ? (
      <span className={s.resendLabel}>
        Didn&apos;t get a code? Resend in {formatTime(seconds)}
        <RefreshArc className={s.resendIcon} />
      </span>
    ) : (
      <>
        <button className={s.resendBtn} onClick={onResend}>
          <span>Re-send password</span>
        </button>
        {error && <HelperText type="error" text={error} />}
      </>
    )}
  </div>
);
