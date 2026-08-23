import { redirect } from 'next/navigation';

import { authUser } from '@/app/_server/auth/getMe';
import { getSharedEvent } from '@/app/_server/event/getSharedEvent';
import { getUserByUsername } from '@/app/_server/user/getUserByUsername';
import { SharedEventPage } from '@/client_pages';
import {
  buildMetadata,
  SHARE_DESCRIPTION,
  SHARE_TITLE,
} from '@/shared/lib/metadata';
import { NEXT_PARAM } from '@/shared/lib/nextPath';

export const metadata = buildMetadata({
  title: 'Shared event · WishWe',
  description: 'Someone shared an event with you on WishWe.',
  shareTitle: SHARE_TITLE,
  shareDescription: SHARE_DESCRIPTION,
});

type Props = {
  params: Promise<{ token: string }>;
};

export default async function Page({ params }: Props) {
  const [{ token }, user] = await Promise.all([params, authUser()]);
  const returnPath = `/share/${encodeURIComponent(token)}`;
  const loginHref = `/onboard?${NEXT_PARAM}=${encodeURIComponent(returnPath)}`;
  const shared = await getSharedEvent(token, {
    includeCredentials: Boolean(user),
  });

  if (shared.status === 'unauthorized') {
    redirect(loginHref);
  }

  const data = shared.status === 'ok' ? shared.data : null;
  const creatorUsername = data?.preview?.creator.username;

  const creatorProfile =
    user && creatorUsername ? await getUserByUsername(creatorUsername) : null;

  return (
    <SharedEventPage
      shared={shared}
      isAuthenticated={Boolean(user)}
      loginHref={loginHref}
      creatorFriendshipStatus={creatorProfile?.friendship_status ?? null}
    />
  );
}
