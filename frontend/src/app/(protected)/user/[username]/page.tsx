import { notFound } from 'next/navigation';
import { getUserByUsername } from '@/app/_server/user/getUserByUsername';
import { UserProfilePage } from '@/client_pages';

type Props = {
  params: Promise<{ username: string }>;
};

export default async function Page({ params }: Props) {
  const { username } = await params;
  const profile = await getUserByUsername(decodeURIComponent(username));

  if (!profile) notFound();

  return <UserProfilePage profile={profile} />;
}
