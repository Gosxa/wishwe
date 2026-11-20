import { redirect } from 'next/navigation';

import { authUser } from '@/app/_server/auth/getMe';
import { SupportPage } from '@client_pages/support';

export default async function Page() {
  const user = await authUser();

  if (!user) {
    redirect('/onboard?next=%2Fsupport');
  }

  const fullName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <SupportPage
      initialEmail={user.user}
      initialDisplayName={fullName || user.username || ''}
    />
  );
}
