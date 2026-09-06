import { GoogleSignInError } from './google-sign-in-errors';

export { GoogleSignInCancelledError, GoogleSignInError } from './google-sign-in-errors';

/** Native platforms use google-sign-in.native.ts; web keeps the email flow. */
export async function requestGoogleIdToken(): Promise<never> {
  throw new GoogleSignInError('Google sign-in is not available on web.');
}
