'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { useLoadingStore } from '@/shared/store/useLoadingStore';
import { Spinner } from '@/shared/ui/spinner/Spinner';

export const GlobalLoader = () => {
  const isLoading = useLoadingStore(s => s.isLoading);
  const setLoading = useLoadingStore(s => s.setLoading);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false);
  }, [pathname, setLoading]);

  if (!isLoading) return null;

  return <Spinner />;
};
