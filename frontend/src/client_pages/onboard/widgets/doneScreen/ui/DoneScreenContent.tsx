import { type DoneScreenVariant } from '@/client_pages/onboard/model';
import s from './doneScreen.module.scss';

type Props = {
  variant: DoneScreenVariant;
};

export const DoneScreenContent = ({ variant }: Props) => {
  if (variant === 'reset') {
    return (
      <div className={s.wrapper}>
        <a href="/feed" className={s.primary}>
          To feed
        </a>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <a href="/feed" className={s.primary}>
        To feed
      </a>
      <a href="/find-friends" className={s.secondary}>
        Find friends
      </a>
    </div>
  );
};
