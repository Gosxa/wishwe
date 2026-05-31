'use client';

import { useState } from 'react';
import { SCREEN_ID, ScreenId } from './screensConfig';

export const useTrack = () => {
  const [screenStack, setScreenStack] = useState<ScreenId[]>([
    SCREEN_ID.LOGIN_SCREEN,
  ]);
  const [pointer, setPointer] = useState<number>(0);

  const next = (id: ScreenId) => {
    setScreenStack(prev => [...prev, id]);
    setPointer(p => p + 1);
  };

  const back = (pointerPos: number) => {
    setPointer(pointerPos);
  };

  return { screenStack, pointer, next, back, setScreenStack };
};
