import s from './doneScreen.module.scss';

export const DoneScreen = () => {
  return (
    <>
      <button className={s.toFeed}>
        <span>To my feed</span>
      </button>
      <button className={s.findFriends}>
        <span>Find friends</span>
      </button>
    </>
  );
};
