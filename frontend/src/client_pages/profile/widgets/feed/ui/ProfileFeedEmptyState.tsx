import type { ProfileTab } from '@client_pages/profile/model/types';
import s from '@client_pages/home/widgets/feed/ui/feedEmptyState.module.scss';

type Props = {
  tab: ProfileTab;
};

const copy: Record<ProfileTab, { title: string; subtitle: string }> = {
  plans: {
    title: 'No plans yet',
    subtitle: 'Plans you create or join will show up here.',
  },
  wishes: {
    title: 'No wishes yet',
    subtitle: 'Wishes you create or show interest in will show up here.',
  },
  archive: {
    title: 'Archive is coming soon',
    subtitle: 'Past plans and wishes will live here once archiving is ready.',
  },
};

export const ProfileFeedEmptyState = ({ tab }: Props) => {
  const { title, subtitle } = copy[tab];

  return (
    <div className={s.empty}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.subtitle}>{subtitle}</p>
    </div>
  );
};
