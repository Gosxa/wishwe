'use client';

import { useEffect } from 'react';

import { Profile } from '@/shared/api/user/types';
import { useUserStore } from './useUserStore';

type Props = {
  user: Profile;
};

export const UserStoreInitializer = ({ user }: Props) => {
  const setUser = useUserStore(s => s.setUser);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return null;
};
