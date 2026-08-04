import { File } from 'expo-file-system';

import { apiRequest } from '@/lib/api/client';

export type Profile = {
  id: number;
  user: string;
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
};

export function getMyProfile(): Promise<Profile> {
  return apiRequest<Profile>('/api/user/profile/me/', { auth: true });
}


export function needsOnboarding(profile: Profile | null): boolean {
  return Boolean(profile) && !profile?.username;
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const data = await apiRequest<{ available: boolean }>(
    `/api/username-check/?username=${encodeURIComponent(username)}`,
  );

  return data.available;
}

export type OnboardingPayload = {
  username: string;
  firstName: string;
  lastName: string;
};

/**
 * Saves the profile details and marks the account as onboarded.
 */
export function submitOnboarding({
  username,
  firstName,
  lastName,
}: OnboardingPayload): Promise<OnboardingPayload> {
  return apiRequest('/api/user/profile/onboarding/', {
    method: 'PATCH',
    body: { username, first_name: firstName, last_name: lastName },
    auth: true,
  });
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_TIMEOUT_MS = 30_000;

/** backend rejects anything outside its allow-list... */
function imageMimeType(uri: string, mimeType?: string | null): string {
  if (mimeType && ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return mimeType;
  }

  if (/\.png($|\?)/i.test(uri)) return 'image/png';
  if (/\.webp($|\?)/i.test(uri)) return 'image/webp';

  return 'image/jpeg';
}


async function imageFormPart(uri: string, name: string, type: string) {
  const bytes = await new File(uri).bytes();

  return { name, type, bytes: () => Promise.resolve(bytes) };
}


export async function uploadAvatar(
  uri: string,
  mimeType?: string | null,
): Promise<{ avatar: string }> {
  const type = imageMimeType(uri, mimeType);
  const extension = type.split('/')[1];

  const form = new FormData();
  form.append('avatar', (await imageFormPart(uri, `avatar.${extension}`, type)) as unknown as Blob);

  return apiRequest('/api/user/profile/avatar/', {
    method: 'PATCH',
    body: form,
    auth: true,
    timeoutMs: UPLOAD_TIMEOUT_MS,
  });
}
