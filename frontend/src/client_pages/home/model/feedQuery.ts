import type { EventListParams } from '@/shared/client_api/event';
import type { FeedFilter, FeedReach, SortOption } from './types';

export const toEventListParams = (
  filter: FeedFilter,
  reach: FeedReach,
  sort: SortOption,
  search: string,
): EventListParams => {
  const params: EventListParams = { sort };

  if (filter === 'plans') params.type = 'plan';
  if (filter === 'wishes') params.type = 'wish';

  if (reach === 'direct') params.visible = 'friends';

  if (search) params.title = search;

  return params;
};
