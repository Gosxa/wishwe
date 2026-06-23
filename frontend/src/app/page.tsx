import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { beApi } from '@/app/_server/api/backend';
import { LandingPage } from '@/client_pages';

export default async function Page() {
  const cookieStore = await cookies();

  // Logged-in users skip the marketing page and go straight to their feed.
  if (cookieStore.get('access_token')) {
    const me = await beApi.user.me(cookieStore.toString());

    if (me.ok) redirect('/feed');
  }

  return <LandingPage />;
}
