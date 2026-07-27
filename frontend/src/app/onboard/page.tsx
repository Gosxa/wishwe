import { OnBoard } from '@/client_pages';
import {
  buildMetadata,
  SHARE_DESCRIPTION,
  SHARE_TITLE,
} from '@/shared/lib/metadata';

// Messenger crawlers carry no cookies, so the auth middleware redirects them
// here from every protected link — including shared events. This is the page
// whose tags end up in the preview card.
export const metadata = buildMetadata({
  title: 'Join WishWe',
  description: 'Create your WishWe account and start planning with friends.',
  shareTitle: SHARE_TITLE,
  shareDescription: SHARE_DESCRIPTION,
});

export default function Page() {
  return <OnBoard />;
}
