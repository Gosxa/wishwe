import { Spinner } from '@/shared';
import { Card } from './Card';
import { PersonRow } from './PersonRow';
import type { FriendRequest } from '../model/types';
import s from './requests.module.scss';

type Props = {
  requests: FriendRequest[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
};

export const Requests = ({
  requests,
  isLoading,
  error = null,
  onRetry,
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
  } else if (error) {
    body = (
      <div className={s.error} role="alert">
        <p className={s.errorText}>{error}</p>
        {onRetry && (
          <button type="button" className={s.retry} onClick={onRetry}>
            <span>Try again</span>
          </button>
        )}
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
            stackActions
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
