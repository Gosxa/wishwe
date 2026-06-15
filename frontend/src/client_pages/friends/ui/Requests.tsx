import { Spinner } from '@/shared';
import { Card } from './Card';
import { PersonRow } from './PersonRow';
import type { FriendRequest } from '../model/types';
import s from './requests.module.scss';

type Props = {
  requests: FriendRequest[];
  isLoading: boolean;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
};

export const Requests = ({
  requests,
  isLoading,
  onAccept,
  onDecline,
}: Props) => {
  let body;

  if (isLoading) {
    body = (
      <div className={s.status}>
        <Spinner />
      </div>
    );
  } else if (requests.length === 0) {
    body = (
      <p className={s.empty}>
        You don&apos;t have any new friend requests at the moment. When someone
        wants to connect, their request will appear here.
      </p>
    );
  } else {
    body = (
      <ul className={s.list}>
        {requests.map(request => (
          <PersonRow
            key={request.id}
            username={request.username}
            avatar={request.avatar}
          >
            <div className={s.actions}>
              <button
                type="button"
                className={s.accept}
                onClick={() => onAccept(request.id)}
              >
                <span>Accept</span>
              </button>
              <button
                type="button"
                className={s.decline}
                onClick={() => onDecline(request.id)}
              >
                <span>Decline</span>
              </button>
            </div>
          </PersonRow>
        ))}
      </ul>
    );
  }

  return <Card title="Requests">{body}</Card>;
};
