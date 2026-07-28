import { type DoneScreenVariant } from '@/client_pages/onboard/model';
import s from './doneScreen.module.scss';

type Props = {
  variant: DoneScreenVariant;
  /** Deep link the user arrived from, or /feed when there was none */
  feedHref: string;
};

export const DoneScreenContent = ({ variant, feedHref }: Props) => {
  if (variant === 'reset') {
    return (
      <div className={s.wrapper}>
        <a href={feedHref} className={s.primary}>
          <span>To feed</span>
        </a>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <a href={feedHref} className={s.primary}>
        <span>To feed</span>
      </a>
      <a href="/friends" className={s.secondary}>
        <span>Find friends</span>
      </a>
    </div>
  );
};
