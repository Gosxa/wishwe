import { OnBoard } from '@/client_pages';
import {
  buildMetadata,
  SHARE_DESCRIPTION,
  SHARE_TITLE,
} from '@/shared/lib/metadata';
import { NEXT_PARAM, safeNextPath } from '@/shared/lib/nextPath';

export const metadata = buildMetadata({
  title: 'Join WishWe',
  description: 'Create your WishWe account and start planning with friends.',
  shareTitle: SHARE_TITLE,
  shareDescription: SHARE_DESCRIPTION,
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  const next = params[NEXT_PARAM];

  return (
    <OnBoard next={safeNextPath(typeof next === 'string' ? next : null)} />
  );
}
