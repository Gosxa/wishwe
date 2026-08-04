import Link from 'next/link';
import clsx from 'clsx';

import { HelperText } from '@/shared';
import s from './loginScreen.module.scss';

type Props = {
  onPrimary: () => void;
  onEmail: () => void;
  googleError: string;
  showJoinWithoutInvite?: boolean;
};

export const LoginScreenContent = ({
  onPrimary,
  onEmail,
  googleError,
  showJoinWithoutInvite = false,
}: Props) => (
  <div className={clsx(s.wrapper, showJoinWithoutInvite && s.inviteWrapper)}>
    <div className={s.primaryWrapper}>
      <button className={s.primary} onClick={onPrimary}>
        <span className={clsx(s.label, s.startLabel)}>Get started</span>
        <span className={clsx(s.label, s.googleLabel)}>
          Continue with Google G
        </span>
      </button>
      {!!googleError && <HelperText type="error" text={googleError} />}
    </div>
    <div className={s.options}>
      <div className={s.spacer}>
        <span>or</span>
      </div>
      <button className={s.email} onClick={onEmail}>
        <span>Continue with email</span>
      </button>
      {showJoinWithoutInvite && (
        <Link href="/onboard" className={s.tertiary}>
          <span>Join without invite</span>
        </Link>
      )}
    </div>
  </div>
);
