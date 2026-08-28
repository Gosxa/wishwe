// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EVENT_IMAGE_FALLBACK } from '@shared/lib/mediaFallbacks';
import { AvatarImage } from './avatarImage/AvatarImage';
import { EventImage } from './eventImage/EventImage';

describe('resilient media', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('replaces a failed event image with the bundled placeholder', () => {
    render(<EventImage src="/media/missing-cover.webp" alt="Event cover" />);

    const cover = screen.getByRole('img', { name: 'Event cover' });

    fireEvent.error(cover);

    expect(cover.getAttribute('src')).toBe(EVENT_IMAGE_FALLBACK);
  });

  it('shows the avatar silhouette when an avatar fails', () => {
    render(
      <AvatarImage
        src="/media/missing-avatar.webp"
        alt="Alice"
        fallbackWidth={48}
        fallbackHeight={48}
      />,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Alice' }));

    expect(screen.queryByRole('img', { name: 'Alice' })).toBeNull();
    expect(document.querySelector('svg')?.getAttribute('width')).toBe('48');
  });

  it('recovers from failures that happen before React attaches handlers', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(
      true,
    );
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(
      0,
    );

    const { container } = render(
      <AvatarImage src="/media/cached-missing-avatar.webp" alt="Alice" />,
    );

    await waitFor(() => expect(container.querySelector('svg')).toBeTruthy());
  });

  it('tries a new source after the previous source failed', () => {
    const { rerender } = render(
      <AvatarImage src="/media/old-avatar.webp" alt="Alice" />,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Alice' }));
    rerender(<AvatarImage src="/media/new-avatar.webp" alt="Alice" />);

    expect(screen.getByRole('img', { name: 'Alice' }).getAttribute('src')).toBe(
      '/media/new-avatar.webp',
    );
  });
});
