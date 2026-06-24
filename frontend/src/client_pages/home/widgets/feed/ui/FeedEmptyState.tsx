import type { FeedFilter } from '@client_pages/home/model/types';
import { Plus } from '@shared/ui/icons';
import { useInviteLink } from '@shared/hooks/useInviteLink';
import { useCreateEventStore } from '@/shared/store/useCreateEventStore';
import s from './feedEmptyState.module.scss';

type Props = {
  filter: FeedFilter;
};

const text: Record<
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

const INVITE_LABELS = {
  idle: 'Invite friends',
  copying: 'Generating…',
  copied: 'Link Copied!',
  error: 'Try again',
} as const;

export const FeedEmptyState = ({ filter }: Props) => {
  const { title, subtitle, create } = text[filter];
  const openCreate = useCreateEventStore(state => state.open);
  const { copy, status } = useInviteLink();

  return (
    <div className={s.empty}>
      <h2 className={s.title}>{title}</h2>
      <p className={s.subtitle}>{subtitle}</p>

      <div className={s.actions}>
        <button
          type="button"
          className={s.create}
          onClick={() => openCreate(filter === 'wishes' ? 'wish' : 'plan')}
        >
          <Plus />
          <span>{create}</span>
        </button>
        <button
          type="button"
          className={s.invite}
          onClick={copy}
          disabled={status === 'copying'}
        >
          <span>{INVITE_LABELS[status]}</span>
        </button>
      </div>
    </div>
  );
};
