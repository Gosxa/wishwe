import { Profile } from './types';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

const checkNickname = async (
  username: string,
): Promise<{ available: boolean }> => {
  const res = await fetch(`${baseURL}/username-check/?username=${username}`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to process data');
  }

  return res.json();
};

const onBoard = async (
  username: string,
  firstName: string = '',
  lastName: string = '',
): Promise<void> => {
  const res = await fetch(`${baseURL}/user/profile/onboarding`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      first_name: firstName,
      last_name: lastName,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to onboard user');
  }
};

const changeAvatar = async (avatar: string): Promise<void> => {
  const res = await fetch(`${baseURL}/user/profile/avatar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar: avatar }),
  });

  if (!res.ok) {
    throw new Error('Failed to upload avatar');
  }
};

const me = async (): Promise<Profile> => {
  const res = await fetch(`${baseURL}/user/profile/me`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Unauthorized');
  }

  return res.json();
};

export { checkNickname, changeAvatar, onBoard, me };
