import { HomePage } from '@/client_pages';
import {
  buildMetadata,
  SHARE_DESCRIPTION,
  SHARE_TITLE,
} from '@/shared/lib/metadata';

// `/feed?event=N` is the link users share. Crawlers are usually redirected to
// /onboard before they get here, but any that do reach it — or that follow the
// link while authenticated — should see the same snippet.
export const metadata = buildMetadata({
  title: 'Feed · WishWe',
  description: 'Wishes and plans from your friends.',
  shareTitle: SHARE_TITLE,
  shareDescription: SHARE_DESCRIPTION,
});

export default function Page() {
  return <HomePage />;
}
