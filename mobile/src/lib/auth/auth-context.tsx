import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { createAccount, login, loginWithGoogle, logout } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import { getMyProfile, needsOnboarding, type Profile } from '@/lib/api/profile';
import { clearSession, loadSession } from '@/lib/auth/session-store';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

type AuthContextValue = {
  status: AuthStatus;
  profile: Profile | null;
  /** True while the account exists but the profile details are still missing. */
  needsOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  finishRegistration: (verificationToken: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const session = await loadSession();

      if (!active) return;

      if (!session) {
        setStatus('signedOut');
        return;
      }

      try {
        const restored = await getMyProfile();
        if (!active) return;

        setProfile(restored);
        setStatus('signedIn');
      } catch (error) {
        if (isAuthError(error)) {
          await clearSession();
        }
        if (!active) return;

        setProfile(null);
        setStatus('signedOut');
      }
    })();

    return () => {
      active = false;
    };
  }, []);


  const completeSignIn = useCallback(async () => {
    try {
      const next = await getMyProfile();
      setProfile(next);
      setStatus('signedIn');
    } catch (error) {
      if (isAuthError(error)) {
        await clearSession();
        setProfile(null);
        setStatus('signedOut');
      }
      throw error;
    }
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
      await completeSignIn();
    },
    [completeSignIn],
  );

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      await loginWithGoogle(idToken);
      await completeSignIn();
    },
    [completeSignIn],
  );

  const finishRegistration = useCallback(
    async (verificationToken: string, password: string) => {
      await createAccount(verificationToken, password);
      await completeSignIn();
    },
    [completeSignIn],
  );

  const refreshProfile = useCallback(async () => {
    try {
      setProfile(await getMyProfile());
    } catch (error) {
      if (isAuthError(error)) {
        await clearSession();
        setProfile(null);
        setStatus('signedOut');
      }
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setProfile(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({
      status,
      profile,
      needsOnboarding: status === 'signedIn' && needsOnboarding(profile),
      signIn,
      signInWithGoogle,
      finishRegistration,
      refreshProfile,
      signOut,
    }),
    [status, profile, signIn, signInWithGoogle, finishRegistration, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}
