import { describe, expect, it } from 'vitest';
import type { EventListParams } from '@/shared/client_api/event';
import type { FeedFilter, FeedReach, SortOption } from './types';
import { toEventListParams } from './feedQuery';

type FilterCase = [filter: FeedFilter, expected: Pick<EventListParams, 'type'>];
type ReachCase = [reach: FeedReach, expected: Pick<EventListParams, 'visible'>];

const filters: FilterCase[] = [
  ['all', {}],
  ['plans', { type: 'plan' }],
  ['wishes', { type: 'wish' }],
];
const reaches: ReachCase[] = [
  ['all', {}],
  ['direct', { visible: 'friends' }],
];
const sorts: SortOption[] = ['soonest', 'recent', 'heat'];

const queryCases = filters.flatMap(([filter, filterParams]) =>
  reaches.flatMap(([reach, reachParams]) =>
    sorts.map(sort => ({
      filter,
      reach,
      sort,
      expected: { sort, ...filterParams, ...reachParams },
    })),
  ),
);

describe('toEventListParams', () => {
  it.each(queryCases)(
    'maps $filter / $reach / $sort to its API query',
    ({ filter, reach, sort, expected }) => {
      expect(toEventListParams(filter, reach, sort, '')).toEqual(expected);
    },
  );

  it('includes a committed title search without altering it', () => {
    expect(
      toEventListParams('wishes', 'direct', 'heat', 'tea & cake/?'),
    ).toEqual({
      type: 'wish',
      visible: 'friends',
      sort: 'heat',
      title: 'tea & cake/?',
    });
  });

  it('omits the title field for an empty search', () => {
    expect(toEventListParams('plans', 'all', 'soonest', '')).toEqual({
      type: 'plan',
      sort: 'soonest',
    });
  });
});
