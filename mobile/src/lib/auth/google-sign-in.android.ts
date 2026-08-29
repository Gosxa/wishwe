import { TurboModuleRegistry } from 'react-native';

import {
  GoogleSignInCancelledError,
  GoogleSignInError,
} from './google-sign-in-errors';

export { GoogleSignInCancelledError, GoogleSignInError } from './google-sign-in-errors';

const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

let isConfigured = false;

function assertGoogleSignInAvailable() {
  if (!googleWebClientId) {
    throw new GoogleSignInError('Google sign-in is not configured for this build.');
  }

  if (!TurboModuleRegistry.get('RNGoogleSignin')) {
    throw new GoogleSignInError(
      'Google sign-in requires a freshly installed WishWe development build instead of Expo Go.',
    );
  }
}

function googleErrorMessage(error: unknown, googleModule: GoogleSignInModule | null): string {
  if (
    googleModule?.isErrorWithCode(error) &&
    error.code === googleModule.statusCodes.PLAY_SERVICES_NOT_AVAILABLE
  ) {
    return 'Google Play Services is unavailable or out of date.';
  }

  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes('RNGoogleSignin') ||
    message.includes('TurboModuleRegistry') ||
    message.includes('Native module')
  ) {
    return 'Google sign-in requires a freshly installed WishWe development build instead of Expo Go.';
  }

  return 'Could not connect to Google. Please try again.';
}

/** Opens Google's native Android account picker and returns an ID token for our API. */
export async function requestGoogleIdToken(): Promise<string> {
  assertGoogleSignInAvailable();

  let googleModule: GoogleSignInModule | null = null;

  try {
    googleModule = await import('@react-native-google-signin/google-signin');

    if (!isConfigured) {
      googleModule.GoogleSignin.configure({
        webClientId: googleWebClientId,
        offlineAccess: false,
      });
      isConfigured = true;
    }

    await googleModule.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await googleModule.GoogleSignin.signIn();

    if (!googleModule.isSuccessResponse(response)) {
      throw new GoogleSignInCancelledError();
    }

    if (!response.data.idToken) {
      throw new GoogleSignInError('Google did not return a valid sign-in token.');
    }

    return response.data.idToken;
  } catch (error) {
    if (error instanceof GoogleSignInCancelledError || error instanceof GoogleSignInError) {
      throw error;
    }

    throw new GoogleSignInError(googleErrorMessage(error, googleModule));
  }
}
