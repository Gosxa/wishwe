import type { UserEventListParams } from '@/shared/client_api/user';
import type { ProfileSort, ProfileTab } from './types';

export const toProfileEventListParams = (
  tab: ProfileTab,
  sort: ProfileSort,
  search: string,
): UserEventListParams => {
  const params: UserEventListParams = { tab, sort };

  if (search) params.title = search;

  return params;
};
