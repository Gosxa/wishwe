import type { EventListParams } from '@/lib/api/events';
import type { FeedFilter, FeedReach, SortOption } from '@/lib/events/types';

export const normalizeSort = (filter: FeedFilter, sort: SortOption): SortOption =>
  filter === 'all' && sort === 'heat' ? 'recent' : sort;

export function toEventListParams(
  filter: FeedFilter,
  reach: FeedReach,
  sort: SortOption,
  search: string,
): EventListParams {
  const params: EventListParams = { sort: normalizeSort(filter, sort) };

  if (filter === 'plans') params.type = 'plan';
  if (filter === 'wishes') params.type = 'wish';

  if (reach === 'direct') params.visible = 'friends';

  if (search) params.title = search;

  return params;
}
