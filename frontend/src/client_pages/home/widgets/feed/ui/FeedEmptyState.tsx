import type { FeedFilter } from '@client_pages/home/model/types';
import { Plus } from '@shared/ui/icons';
import s from './feedEmptyState.module.scss';

type Props = {
  filter: FeedFilter;
};

const copy: Record<
  FeedFilter,
  { title: string; subtitle: string; create: string }
> = {
  all: {
    title: 'Waiting for adventures?',
    subtitle:
      'Invite your friends to see their plans here, or start your own right now.',
    create: 'Create',
  },
  plans: {
    title: "It's a bit quiet here",
    subtitle:
      'Your calendar is empty. Create a plan or invite friends to see what they are up to.',
    create: 'Create a plan',
  },
  wishes: {
    title: 'No wishes yet',
    subtitle: 'Share your dreams or invite friends to see theirs.',
    create: 'Create a wish',
  },
};

export const FeedEmptyState = ({ filter }: Props) => {
  const { title, subtitle, create } = copy[filter];

  return (
    <div className={s.empty}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.subtitle}>{subtitle}</p>

      <div className={s.actions}>
        <button type="button" className={s.create}>
          <Plus />
          <span>{create}</span>
        </button>
        <button type="button" className={s.invite}>
          <span>Invite friends</span>
        </button>
      </div>
    </div>
  );
};
