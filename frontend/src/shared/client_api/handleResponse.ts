import { useUserStore } from '@/shared/store/useUserStore';

export const handleUnauthorized = (res: Response): void => {
  if (res.status !== 401) return;

  useUserStore.getState().clearUser();
  window.location.href = '/onboard';
  throw new Error('Unauthorized');
};
