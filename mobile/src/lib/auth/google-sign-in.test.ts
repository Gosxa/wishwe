import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const googleMocks = vi.hoisted(() => ({
  platform: { OS: 'android' },
  configure: vi.fn(),
  getNativeModule: vi.fn(),
  hasPlayServices: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: googleMocks.platform,
  TurboModuleRegistry: { get: googleMocks.getNativeModule },
}));

vi.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: googleMocks,
  isErrorWithCode: (error: unknown) =>
    error instanceof Error && 'code' in error,
  isSuccessResponse: (response: { type: string }) => response.type === 'success',
  statusCodes: {
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'web-client-id');
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'ios-client-id');
  googleMocks.platform.OS = 'android';
  googleMocks.configure.mockReset();
  googleMocks.getNativeModule.mockReset().mockReturnValue({});
  googleMocks.hasPlayServices.mockReset().mockResolvedValue(true);
  googleMocks.signIn.mockReset().mockResolvedValue({
    type: 'success',
    data: { idToken: 'google-id-token' },
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe.each(['android', 'ios'])('requestGoogleIdToken on %s', (platform) => {
  beforeEach(() => {
    googleMocks.platform.OS = platform;
  });

  it('returns a Google ID token configured for the backend audience', async () => {
    const { requestGoogleIdToken } = await import('./google-sign-in.native');

    await expect(requestGoogleIdToken()).resolves.toBe('google-id-token');
    expect(googleMocks.configure).toHaveBeenCalledWith({
      ...(platform === 'ios' ? { iosClientId: 'ios-client-id' } : {}),
      webClientId: 'web-client-id',
      offlineAccess: false,
    });
    if (platform === 'android') {
      expect(googleMocks.hasPlayServices).toHaveBeenCalledWith({
        showPlayServicesUpdateDialog: true,
      });
    } else {
      expect(googleMocks.hasPlayServices).not.toHaveBeenCalled();
    }
  });

  it('reports cancellation separately from an authentication error', async () => {
    googleMocks.signIn.mockResolvedValue({ type: 'cancelled', data: null });

    const { GoogleSignInCancelledError, requestGoogleIdToken } = await import(
      './google-sign-in.native'
    );

    await expect(requestGoogleIdToken()).rejects.toBeInstanceOf(GoogleSignInCancelledError);
  });

  it('rejects safely when the running binary does not include Google sign-in', async () => {
    googleMocks.getNativeModule.mockReturnValue(null);

    const { requestGoogleIdToken } = await import('./google-sign-in.native');

    await expect(requestGoogleIdToken()).rejects.toThrow(
      'Google sign-in requires a freshly installed WishWe development build instead of Expo Go.',
    );
    expect(googleMocks.signIn).not.toHaveBeenCalled();
  });

  it('does not open Google without the backend Web client ID', async () => {
    vi.stubEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', '   ');
    const { requestGoogleIdToken } = await import('./google-sign-in.native');

    await expect(requestGoogleIdToken()).rejects.toThrow(
      'Google sign-in is not configured for this build.',
    );
    expect(googleMocks.configure).not.toHaveBeenCalled();
    expect(googleMocks.signIn).not.toHaveBeenCalled();
  });

  it('rejects a successful sign-in that has no ID token', async () => {
    googleMocks.signIn.mockResolvedValue({
      type: 'success',
      data: { idToken: null },
    });
    const { requestGoogleIdToken } = await import('./google-sign-in.native');

    await expect(requestGoogleIdToken()).rejects.toThrow(
      'Google did not return a valid sign-in token.',
    );
  });

  it('reports a native sign-in failure as an authentication error', async () => {
    googleMocks.signIn.mockRejectedValue(new Error('Network unavailable'));
    const { requestGoogleIdToken } = await import('./google-sign-in.native');

    await expect(requestGoogleIdToken()).rejects.toThrow(
      'Could not connect to Google. Please try again.',
    );
  });
});

it('does not open Google on iOS without its iOS client ID', async () => {
  googleMocks.platform.OS = 'ios';
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', '   ');
  const { requestGoogleIdToken } = await import('./google-sign-in.native');

  await expect(requestGoogleIdToken()).rejects.toThrow(
    'Google sign-in is not configured for this build.',
  );
  expect(googleMocks.configure).not.toHaveBeenCalled();
  expect(googleMocks.signIn).not.toHaveBeenCalled();
});

it('keeps Android sign-in available without iOS configuration', async () => {
  vi.stubEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', '');
  const { requestGoogleIdToken } = await import('./google-sign-in.native');

  await expect(requestGoogleIdToken()).resolves.toBe('google-id-token');
});

it('shows a useful error when Android Google Play Services is unavailable', async () => {
  googleMocks.hasPlayServices.mockRejectedValue(
    Object.assign(new Error('Unavailable'), { code: 'PLAY_SERVICES_NOT_AVAILABLE' }),
  );
  const { requestGoogleIdToken } = await import('./google-sign-in.native');

  await expect(requestGoogleIdToken()).rejects.toThrow(
    'Google Play Services is unavailable or out of date.',
  );
  expect(googleMocks.signIn).not.toHaveBeenCalled();
});

it('keeps the web fallback independent of the native Google SDK', async () => {
  googleMocks.platform.OS = 'web';
  const { requestGoogleIdToken } = await import('./google-sign-in');

  await expect(requestGoogleIdToken()).rejects.toThrow(
    'Google sign-in is not available on web.',
  );
  expect(googleMocks.getNativeModule).not.toHaveBeenCalled();
  expect(googleMocks.signIn).not.toHaveBeenCalled();
});
