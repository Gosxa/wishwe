import type { Metadata } from 'next';

import { PrivacyPolicyPage } from '@client_pages/privacyPolicy';
import { buildMetadata } from '@/shared/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Privacy Policy | WishWe',
  description:
    'Learn how WishWe collects, uses, and protects your information.',
});

export default function Page() {
  return <PrivacyPolicyPage />;
}
