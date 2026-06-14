import { Plus } from '@shared/ui/icons';
import type { ProfileTab } from '@client_pages/profile/model/types';
import { useCreateEventStore } from '@/shared/store/useCreateEventStore';
import s from '@client_pages/home/widgets/feed/ui/feedEmptyState.module.scss';

type Props = {
  tab: ProfileTab;
};

const copy: Record<
  ProfileTab,
  { title: string; subtitle: string; create?: string }
> = {
  plans: {
    title: 'No plans yet',
    subtitle: 'Plans you create or join will show up here.',
  },
  wishes: {
    title: 'No wishes yet',
    subtitle: 'Wishes you create or show interest in will show up here.',
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

      {create && (
        <div className={s.actions}>
          <button
            type="button"
            className={s.create}
            onClick={() => openCreate('plan')}
          >
            <Plus />
            <span>{create}</span>
          </button>
        </div>
      )}
    </div>
  );
};
