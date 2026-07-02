import clsx from 'clsx';
import { Spinner } from '@/shared';
import { Card } from './Card';
import { PersonRow } from './PersonRow';
import type { SearchResult } from '../model/types';
import s from './morePeople.module.scss';

type Props = {
  results: SearchResult[];
  hasMore: boolean;
  isSearching: boolean;
  error: string | null;
};

export const MorePeople = ({ results, hasMore, isSearching, error }: Props) => {
  let body;

  if (isSearching && results.length === 0 && !error) {
    body = (
      <div className={s.status}>
        <Spinner inline />
      </div>
    );
  } else if (error) {
    body = <p className={s.message}>Something went wrong. Please try again.</p>;
  } else if (results.length === 0) {
    body = <p className={s.message}>No other people match your search.</p>;
  } else {
    body = (
      <>
        <ul className={clsx(s.list, isSearching && s.stale)}>
          {results.map(person => (
            <PersonRow
              key={person.userId}
              username={person.username}
              name={person.name}
              avatar={person.avatar}
            />
          ))}
        </ul>
        {hasMore && (
          <p className={s.more}>
            More people match this search. Keep typing to narrow it down.
          </p>
        )}
      </>
    );
  }

  return (
    <Card title="More people">
      <p className={s.hint}>
        People on WishWe who are not your friends yet. Open a profile to send a
        friend request.
      </p>
      {body}
    </Card>
  );
};
