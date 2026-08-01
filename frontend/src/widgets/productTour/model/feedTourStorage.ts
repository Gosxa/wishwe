const storageKey = (profileId: number) => `wishwe:feed-tour-seen:${profileId}`;

export const hasSeenLocally = (profileId: number) => {
  try {
    return window.localStorage.getItem(storageKey(profileId)) === '1';
  } catch {
    return false;
  }
};

export const rememberLocally = (profileId: number) => {
  try {
    window.localStorage.setItem(storageKey(profileId), '1');
  } catch {
    // _
  }
};
