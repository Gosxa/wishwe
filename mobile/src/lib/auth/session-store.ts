import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Persisted JWT pair
 */
export type Session = {
  access: string;
  refresh: string | null;
};

const ACCESS_KEY = 'wishwe.access_token';
const REFRESH_KEY = 'wishwe.refresh_token';


const isWeb = Platform.OS === 'web';

async function readItem(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      return globalThis.localStorage?.getItem(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeItem(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      globalThis.localStorage?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Ignore — the user can still use the app, but they will have to log in again next time.
  }
}

async function removeItem(key: string): Promise<void> {
  try {
    if (isWeb) {
      globalThis.localStorage?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore. see writeItem.
  }
}


let session: Session | null = null;
let loaded = false;


export async function loadSession(): Promise<Session | null> {
  if (loaded) {
    return session;
  }

  const [access, refresh] = await Promise.all([readItem(ACCESS_KEY), readItem(REFRESH_KEY)]);

  session = access ? { access, refresh } : null;
  loaded = true;

  return session;
}


export function getSession(): Session | null {
  return session;
}

export async function saveSession(next: Session): Promise<void> {
  session = next;
  loaded = true;

  await Promise.all([
    writeItem(ACCESS_KEY, next.access),
    next.refresh ? writeItem(REFRESH_KEY, next.refresh) : removeItem(REFRESH_KEY),
  ]);
}


export async function saveAccessToken(access: string, forRefresh: string | null): Promise<void> {
  if (session?.refresh !== forRefresh) {
    return;
  }

  session = { access, refresh: forRefresh };
  loaded = true;

  await writeItem(ACCESS_KEY, access);
}

export async function clearSession(): Promise<void> {
  session = null;
  loaded = true;

  await Promise.all([removeItem(ACCESS_KEY), removeItem(REFRESH_KEY)]);
}
