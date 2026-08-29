import { beforeEach, describe, expect, it, vi } from 'vitest';

const googleMocks = vi.hoisted(() => ({
  configure: vi.fn(),
  getNativeModule: vi.fn(),
  hasPlayServices: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
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

describe('requestGoogleIdToken', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'web-client-id');
    googleMocks.configure.mockReset();
    googleMocks.getNativeModule.mockReset().mockReturnValue({});
    googleMocks.hasPlayServices.mockReset().mockResolvedValue(true);
    googleMocks.signIn.mockReset();
  });

  it('opens Google sign-in and returns its ID token', async () => {
    googleMocks.signIn.mockResolvedValue({
      type: 'success',
      data: { idToken: 'google-id-token' },
    });

    const { requestGoogleIdToken } = await import('./google-sign-in.android');

    await expect(requestGoogleIdToken()).resolves.toBe('google-id-token');
    expect(googleMocks.configure).toHaveBeenCalledWith({
      webClientId: 'web-client-id',
      offlineAccess: false,
    });
    expect(googleMocks.hasPlayServices).toHaveBeenCalledWith({
      showPlayServicesUpdateDialog: true,
    });
  });

  it('reports cancellation separately from an authentication error', async () => {
    googleMocks.signIn.mockResolvedValue({ type: 'cancelled', data: null });

    const { GoogleSignInCancelledError, requestGoogleIdToken } = await import(
      './google-sign-in.android'
    );

    await expect(requestGoogleIdToken()).rejects.toBeInstanceOf(GoogleSignInCancelledError);
  });

  it('shows a useful error when Google Play Services is unavailable', async () => {
    googleMocks.hasPlayServices.mockRejectedValue(
      Object.assign(new Error('Unavailable'), { code: 'PLAY_SERVICES_NOT_AVAILABLE' }),
    );

    const { requestGoogleIdToken } = await import('./google-sign-in.android');

    await expect(requestGoogleIdToken()).rejects.toThrow(
      'Google Play Services is unavailable or out of date.',
    );
  });

  it('rejects safely when the running binary does not include Google sign-in', async () => {
    googleMocks.getNativeModule.mockReturnValue(null);

    const { requestGoogleIdToken } = await import('./google-sign-in.android');

    await expect(requestGoogleIdToken()).rejects.toThrow(
      'Google sign-in requires a freshly installed WishWe development build instead of Expo Go.',
    );
    expect(googleMocks.signIn).not.toHaveBeenCalled();
  });
});
