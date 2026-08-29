import { GoogleSignInError } from './google-sign-in-errors';

export { GoogleSignInCancelledError, GoogleSignInError } from './google-sign-in-errors';

/** Google sign-in is not configured on iOS or web yet. */
export async function requestGoogleIdToken(): Promise<never> {
  throw new GoogleSignInError('Google sign-in is currently available on Android only.');
}
