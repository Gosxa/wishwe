'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { ScreenId } from './screensConfig';

type BackAction = {
  label: string;
  onBack: () => void;
};

type BackContextValue = {
  actions: Partial<Record<ScreenId, BackAction>>;
  register: (id: ScreenId, action: BackAction) => void;
  unregister: (id: ScreenId) => void;
};

const BackContext = createContext<BackContextValue | null>(null);

const useBackContext = () => {
  const ctx = useContext(BackContext);

  if (!ctx) {
    throw new Error('useBackContext must be used within BackProvider');
  }

  return ctx;
};

type Props = {
  children: ReactNode;
};

export const BackProvider = ({ children }: Props) => {
  const [actions, setActions] = useState<Partial<Record<ScreenId, BackAction>>>(
    {},
  );

  const register = useCallback((id: ScreenId, action: BackAction) => {
    setActions(prev => ({ ...prev, [id]: action }));
  }, []);

  const unregister = useCallback((id: ScreenId) => {
    setActions(prev => {
      if (!(id in prev)) return prev;

      const rest = { ...prev };

      delete rest[id];

      return rest;
    });
  }, []);

  return (
    <BackContext value={{ actions, register, unregister }}>
      {children}
    </BackContext>
  );
};

export const useActiveBackAction = (id: ScreenId | undefined) => {
  const { actions } = useBackContext();

  return id === undefined ? undefined : actions[id];
};

export const useRegisterBack = (id: ScreenId, action: BackAction) => {
  const { register, unregister } = useBackContext();
  const actionRef = useRef(action);

  useEffect(() => {
    actionRef.current = action;
  });

  useEffect(() => {
    register(id, {
      label: action.label,
      onBack: () => actionRef.current.onBack(),
    });

    return () => unregister(id);
  }, [id, action.label, register, unregister]);
};
