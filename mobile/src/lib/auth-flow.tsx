import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AuthFlowContextValue = {
  email: string;
  setEmail: (email: string) => void;
};

const AuthFlowContext = createContext<AuthFlowContextValue | null>(null);

export function AuthFlowProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState('');

  const value = useMemo(() => ({ email, setEmail }), [email]);

  return <AuthFlowContext.Provider value={value}>{children}</AuthFlowContext.Provider>;
}

export function useAuthFlow() {
  const ctx = useContext(AuthFlowContext);
  if (!ctx) {
    throw new Error('useAuthFlow must be used within AuthFlowProvider');
  }
  return ctx;
}
