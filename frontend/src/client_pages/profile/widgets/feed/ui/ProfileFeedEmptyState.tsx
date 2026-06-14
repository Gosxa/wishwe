import { Plus } from '@shared/ui/icons';
import type { ProfileTab } from '@client_pages/profile/model/types';
import { useCreateEventStore } from '@/shared/store/useCreateEventStore';
import s from './profileFeedEmptyState.module.scss';

type Props = {
  tab: ProfileTab;
};

const copy: Record<
  ProfileTab,
  { title: string; subtitle: string; create: string }
> = {
  plans: {
    title: 'No active plans',
    subtitle:
      'Looks like your calendar is free. Time to organize something cool!',
    create: 'Create a plan',
  },
  wishes: {
    title: 'No wishes yet',
    subtitle:
      "Your future adventures start here. Add something you'd love to do.",
    create: 'Create a plan',
  },
  archive: {
    title: 'No past events yet',
    subtitle: 'Your history is a blank canvas. Go make some memories!',
    create: 'Create a plan',
  },
};

export const ProfileFeedEmptyState = ({ tab }: Props) => {
  const { title, subtitle, create } = copy[tab];
  const openCreate = useCreateEventStore(state => state.open);

  return (
    <div className={s.empty}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.subtitle}>{subtitle}</p>

      <button
        type="button"
        className={s.create}
        onClick={() => openCreate('plan')}
      >
        <Plus />
        <span>{create}</span>
      </button>
    </div>
  );
};
