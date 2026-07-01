import type { ProfileTab } from '@client_pages/profile/model/types';
import s from '@client_pages/profile/widgets/feed/ui/profileFeedEmptyState.module.scss';

type Props = { tab: ProfileTab };

const copy: Record<ProfileTab, { title: string; subtitle: string }> = {
  plans: {
    title: 'No plans yet',
    subtitle:
      "This profile doesn't have any plans listed right now. Check back later to see what they are down for!",
  },
  wishes: {
    title: 'No wishes yet',
    subtitle:
      "This profile doesn't have any wishes listed right now. Check back later to see what they are down for!",
  },
  archive: {
    title: 'No past events yet',
    subtitle:
      "This profile doesn't have any past events listed right now. Check back later to see what they are down for!",
  },
};

export const UserProfileEmptyState = ({ tab }: Props) => {
  const { title, subtitle } = copy[tab];

  return (
    <div className={s.empty}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.subtitle}>{subtitle}</p>
    </div>
  );
};
