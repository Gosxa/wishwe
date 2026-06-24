'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createInvite } from '@/shared/client_api/user';

export type InviteLinkStatus = 'idle' | 'copying' | 'copied' | 'error';

const RESET_MS = 2500;

export const useInviteLink = () => {
  const [status, setStatus] = useState<InviteLinkStatus>('idle');
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetRef.current) clearTimeout(resetRef.current);
    },
    [],
  );

  const copy = useCallback(async () => {
    if (resetRef.current) clearTimeout(resetRef.current);
    setStatus('copying');

    try {
      const { token } = await createInvite();
      const link = `${window.location.origin}/invite/${token}`;

      await navigator.clipboard.writeText(link);
      setStatus('copied');
    } catch {
      setStatus('error');
    }

    resetRef.current = setTimeout(() => setStatus('idle'), RESET_MS);
  }, []);

  return { copy, status };
};
