import type { Profile } from '@/shared/client_api/auth/types';
import { acceptInvite } from '@/shared/client_api/user';

import { SCREEN_ID, type InviteContext, type ScreenId } from './screensConfig';

type Params = {
  user: Profile;
  invite: InviteContext | null | undefined;
  next: (id: ScreenId) => void;
  navigateHome: () => void;
  prefillGoogleProfile: (user: Profile) => void;
};

export const handleGooglePostAuth = async ({
  user,
  invite,
  next,
  navigateHome,
  prefillGoogleProfile,
}: Params): Promise<void> => {
  if (!invite) {
    if (user.username) {
      navigateHome();
    } else {
      prefillGoogleProfile(user);
      next(SCREEN_ID.PERSONAL_GOOGLE);
    }

    return;
  }

  if (user.username) {
    await acceptInvite(invite.token);
    next(SCREEN_ID.INVITE_REQUEST_SENT);
  } else {
    prefillGoogleProfile(user);
    next(SCREEN_ID.PERSONAL_GOOGLE);
  }
};
