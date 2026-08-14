import { describe, expect, it } from 'vitest';
import type { UserEventListParams } from '@/shared/client_api/user';
import type { ProfileSort, ProfileTab } from './types';
import { toProfileEventListParams } from './profileEventsQuery';

type QueryCase = {
  tab: ProfileTab;
  sort: ProfileSort;
  expected: UserEventListParams;
};

const queryCases: QueryCase[] = [
  {
    tab: 'plans',
    sort: 'recent',
    expected: { tab: 'plans', sort: 'recent' },
  },
  {
    tab: 'plans',
    sort: 'soonest',
    expected: { tab: 'plans', sort: 'soonest' },
  },
  {
    tab: 'wishes',
    sort: 'recent',
    expected: { tab: 'wishes', sort: 'recent' },
  },
  {
    tab: 'wishes',
    sort: 'soonest',
    expected: { tab: 'wishes', sort: 'soonest' },
  },
  {
    tab: 'archive',
    sort: 'recent',
    expected: { tab: 'archive', sort: 'recent' },
  },
  {
    tab: 'archive',
    sort: 'soonest',
    expected: { tab: 'archive', sort: 'soonest' },
  },
];

describe('toProfileEventListParams', () => {
  it.each(queryCases)(
    'maps $tab / $sort to its API query',
    ({ tab, sort, expected }) => {
      expect(toProfileEventListParams(tab, sort, '')).toEqual(expected);
    },
  );

  it.each(queryCases)(
    'includes a committed title for $tab / $sort',
    ({ tab, sort, expected }) => {
      expect(toProfileEventListParams(tab, sort, 'tea & cake/?')).toEqual({
        ...expected,
        title: 'tea & cake/?',
      });
    },
  );

  it('omits the title field for an empty search', () => {
    expect(toProfileEventListParams('archive', 'recent', '')).toEqual({
      tab: 'archive',
      sort: 'recent',
    });
  });
});
