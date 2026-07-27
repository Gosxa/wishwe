import type { Metadata } from 'next';

/**
 * Absolute origin used to resolve the relative URLs Next.js puts in
 * `og:image` / `og:url`. Open Graph crawlers reject relative paths, so this
 * has to be a real origin — change it here if the app moves domain.
 */
export const SITE_URL = 'https://wishwe.online';

const OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'WishWe — you’re invited to something good',
};

/**
 * Snippet shown when an event link (`/feed?event=N`) is pasted into a
 * messenger. It stays deliberately event-agnostic: the backend only serves
 * event data to authorised users, and an unauthenticated crawler is bounced
 * to /onboard by the auth middleware before it ever reaches the feed.
 */
export const SHARE_TITLE = 'You’re invited on WishWe';
export const SHARE_DESCRIPTION =
  'A friend shared a plan with you. See what’s happening, who’s going, and say you’re in.';

type Args = {
  /** Browser tab and search-result title. */
  title: string;
  description: string;
  shareTitle?: string;
  shareDescription?: string;
};

export const buildMetadata = ({
  title,
  description,
  shareTitle = title,
  shareDescription = description,
}: Args): Metadata => ({
  title,
  description,
  openGraph: {
    type: 'website',
    siteName: 'WishWe',
    locale: 'en_US',
    title: shareTitle,
    description: shareDescription,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: shareTitle,
    description: shareDescription,
    images: [OG_IMAGE.url],
  },
});
