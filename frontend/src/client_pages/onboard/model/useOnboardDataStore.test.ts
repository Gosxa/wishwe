import { beforeEach, describe, expect, it } from 'vitest';
import { useOnboardDataStore } from './useOnboardDataStore';

describe('useOnboardDataStore', () => {
  beforeEach(() => {
    useOnboardDataStore.getState().reset();
  });

  it('updates each onboarding field and nullable value', () => {
    const store = useOnboardDataStore.getState();

    store.setField('email', 'amy@example.com');
    store.setField('password', 'Password1');
    store.setField('nickname', 'amy');
    store.setField('firstName', 'Amy');
    store.setField('lastName', 'Lee');
    store.setAvatarUrl('blob:avatar');
    store.setVerificationToken('verification-token');

    expect(useOnboardDataStore.getState()).toMatchObject({
      avatarUrl: 'blob:avatar',
      email: 'amy@example.com',
      firstName: 'Amy',
      lastName: 'Lee',
      nickname: 'amy',
      password: 'Password1',
      verificationToken: 'verification-token',
    });

    useOnboardDataStore.getState().setAvatarUrl(null);
    expect(useOnboardDataStore.getState().avatarUrl).toBeNull();
  });

  it('resets all data while preserving the store actions', () => {
    const originalActions = {
      reset: useOnboardDataStore.getState().reset,
      setAvatarUrl: useOnboardDataStore.getState().setAvatarUrl,
      setField: useOnboardDataStore.getState().setField,
      setVerificationToken: useOnboardDataStore.getState().setVerificationToken,
    };

    originalActions.setField('email', 'amy@example.com');
    originalActions.setField('nickname', 'amy');
    originalActions.setAvatarUrl('blob:avatar');
    originalActions.setVerificationToken('verification-token');
    originalActions.reset();

    expect(useOnboardDataStore.getState()).toMatchObject({
      avatarUrl: null,
      email: '',
      firstName: '',
      lastName: '',
      nickname: '',
      password: '',
      verificationToken: null,
      ...originalActions,
    });
  });
});
