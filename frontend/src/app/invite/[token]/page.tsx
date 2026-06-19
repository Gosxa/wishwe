import { beApi } from '@/app/_server/api/backend';
import { toAbsoluteMediaUrl } from '@/shared/lib/mediaUrl';
import { InviteLanding } from '@/client_pages';

type Props = {
  params: Promise<{ token: string }>;
};

type InviteDetails = {
  sender_id: number;
  username: string;
  avatar: string | null;
};

export default async function Page({ params }: Props) {
  const { token } = await params;

  let username: string | undefined;
  let avatarSrc: string | null | undefined;

  // Public endpoint — broken/expired tokens (404) fall back to placeholders.
  const res = await beApi.user.inviteDetails(token);

  if (res.ok) {
    const data = (await res.json()) as InviteDetails;

    username = data.username ?? undefined;
    avatarSrc = toAbsoluteMediaUrl(data.avatar ?? null);
  }

  return (
    <InviteLanding token={token} username={username} avatarSrc={avatarSrc} />
  );
}
