import s from '@client_pages/profile/widgets/feed/ui/profileFeedEmptyState.module.scss';

type Props = { username: string };

export const FriendsOnlyState = ({ username }: Props) => (
  <div className={s.empty}>
    <h2 className={s.title}>Friends-only profile</h2>
    <p className={s.subtitle}>
      Only friends can see @{username}&apos;s upcoming plans.
    </p>
  </div>
);
