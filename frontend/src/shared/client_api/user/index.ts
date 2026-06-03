export const checkUsername = async (
  username: string,
): Promise<{ available: boolean }> => {
  const res = await fetch(
    `/next_api/user/check-username?username=${encodeURIComponent(username)}`,
  );

  if (!res.ok) throw new Error('Failed');

  return res.json();
};

export const onBoard = async (
  username: string,
  firstName: string = '',
  lastName: string = '',
): Promise<void> => {
  const res = await fetch('/next_api/user/onboard', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      first_name: firstName,
      last_name: lastName,
    }),
  });

  if (!res.ok) throw new Error('Failed to onboard');
};

export const changeAvatar = async (avatar: string): Promise<void> => {
  const res = await fetch('/next_api/user/avatar', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ avatar }),
  });

  if (!res.ok) throw new Error('Failed to upload avatar');
};
