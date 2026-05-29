import s from './doneScreen.module.scss';

type Props = {
  isReset: boolean;
};

export const DoneScreenContent = ({ isReset }: Props) => {
  if (isReset) {
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
