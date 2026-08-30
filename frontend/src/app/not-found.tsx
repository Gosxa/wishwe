import { NotFound } from '@/client_pages';
import { buildMetadata } from '@/shared/lib/metadata';

export const metadata = buildMetadata({
  title: 'Page not found · WishWe',
  description: 'This page has moved on. Head back to your feed.',
});

export default function NotFoundPage() {
  return <NotFound />;
}
