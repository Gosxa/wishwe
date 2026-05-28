'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useTrack } from './useTrack';

type TrackContextValue = ReturnType<typeof useTrack>;

const TrackContext = createContext<TrackContextValue | null>(null);

export const useTrackContext = () => {
  const ctx = useContext(TrackContext);

  if (!ctx) {
    throw new Error('useTrackContext must be used within TrackProvider');
  }

  return ctx;
};

type Props = {
  children: ReactNode;
};

export const TrackProvider = ({ children }: Props) => {
  const value = useTrack();

  return (
    <TrackContext.Provider value={value}>{children}</TrackContext.Provider>
  );
};
