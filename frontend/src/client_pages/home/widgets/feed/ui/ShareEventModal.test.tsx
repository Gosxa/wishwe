// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FeedEvent } from '@client_pages/home/model/types';

const mocks = vi.hoisted(() => ({
  createShareLink: vi.fn(),
  generateShareImages: vi.fn(),
}));

vi.mock('@/features', () => ({
  useBodyScrollLock: vi.fn(),
}));

vi.mock('@/shared/client_api/event', () => ({
  createShareLink: mocks.createShareLink,
}));

vi.mock('@client_pages/home/model/shareImage', async importOriginal => {
  const actual =
    await importOriginal<
      typeof import('@client_pages/home/model/shareImage')
    >();

  return {
    ...actual,
    generateShareImages: mocks.generateShareImages,
  };
});

import { ShareEventModal } from './ShareEventModal';

const event: FeedEvent = {
  id: '42',
  type: 'plan',
  hashtag: '#travel',
  image: '/cover.jpg',
  title: 'Weekend trip',
  host: { username: '@host', avatar: null },
  date: 'Friday, August 14 @ 12:00',
  startsAt: Date.parse('2026-08-14T12:00:00Z'),
  createdAt: Date.parse('2026-08-12T12:00:00Z'),
  location: 'Kyiv, Podil',
  description: 'A short trip with friends',
  chatLink: null,
  participantCount: 4,
  maxParticipants: 10,
  participants: [],
  userParticipationStatus: null,
};

const generatedImages = () => [
  { format: 'poster', blob: new Blob(['poster'], { type: 'image/png' }) },
  { format: 'card', blob: new Blob(['card'], { type: 'image/png' }) },
  { format: 'story', blob: new Blob(['story'], { type: 'image/png' }) },
];

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(promiseResolve => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
};

const renderModal = (isOwn = false) => {
  const returnFocusRef = createRef<HTMLButtonElement>();

  return render(
    <ShareEventModal
      event={event}
      isOwn={isOwn}
      onClose={vi.fn()}
      returnFocusRef={returnFocusRef}
    />,
  );
};

describe('ShareEventModal', () => {
  let clipboardWrite: ReturnType<typeof vi.fn>;
  let clipboardWriteText: ReturnType<typeof vi.fn>;
  let windowOpen: ReturnType<typeof vi.fn>;
  let objectUrlIndex: number;

  beforeEach(() => {
    mocks.createShareLink.mockReset();
    mocks.generateShareImages.mockReset();
    mocks.createShareLink.mockResolvedValue(
      'https://api.example.test/share/secret?token=ignored',
    );
    mocks.generateShareImages.mockResolvedValue(generatedImages());

    clipboardWrite = vi.fn().mockResolvedValue(undefined);
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        write: clipboardWrite,
        writeText: clipboardWriteText,
      },
    });
    vi.stubGlobal('ClipboardItem', undefined);

    objectUrlIndex = 0;
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => `blob:share-${++objectUrlIndex}`),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });

    windowOpen = vi.fn();
    vi.stubGlobal('open', windowOpen);
    window.sessionStorage.clear();

    const localStore = new Map<string, string>();

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => localStore.get(key) ?? null,
        setItem: (key: string, value: string) => {
          localStore.set(key, String(value));
        },
        removeItem: (key: string) => {
          localStore.delete(key);
        },
        clear: () => {
          localStore.clear();
        },
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('builds social destinations and handles the Instagram Story notice workflow', async () => {
    renderModal();

    await screen.findByRole('img', {
      name: 'Poster share image for Weekend trip',
    });

    const telegram = screen.getByRole('link', { name: 'Telegram' });
    const telegramUrl = new URL(telegram.getAttribute('href')!);

    expect(telegramUrl.origin).toBe('https://t.me');
    expect(telegramUrl.searchParams.get('url')).toBe(
      `${window.location.origin}/feed?event=42`,
    );
    expect(telegramUrl.searchParams.get('text')).toBe('Weekend trip');
    expect(
      screen.getByRole('link', { name: 'WhatsApp' }).getAttribute('href'),
    ).toContain('https://wa.me/');
    expect(
      screen.getByRole('link', { name: 'X' }).getAttribute('href'),
    ).toContain('https://x.com/intent/post');
    expect(
      screen.getByRole('link', { name: 'Facebook' }).getAttribute('href'),
    ).toContain('https://www.facebook.com/sharer/sharer.php');

    const stories = screen.getByRole('link', { name: 'Stories' });

    expect(stories.getAttribute('download')).toBe(
      'wishwe-weekend-trip-story.png',
    );
    fireEvent.click(stories);

    expect(
      screen.getByRole('tab', { name: 'Story' }).getAttribute('aria-selected'),
    ).toBe('true');
    expect(window.sessionStorage.getItem('wishwe-share-format')).toBe('story');

    const noticeDialog = screen.getByRole('dialog', {
      name: 'Post to Instagram Stories',
    });

    expect(noticeDialog).toBeTruthy();
    expect(windowOpen).not.toHaveBeenCalled();

    fireEvent.click(noticeDialog.parentElement as HTMLElement);
    expect(
      screen.getByRole('dialog', { name: 'Post to Instagram Stories' }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(
      screen.queryByRole('dialog', { name: 'Post to Instagram Stories' }),
    ).toBeNull();
    expect(windowOpen).not.toHaveBeenCalled();

    fireEvent.click(stories);
    const checkbox = screen.getByRole('checkbox', {
      name: 'Don’t show this again',
    });

    fireEvent.click(checkbox);
    fireEvent.click(
      screen.getByRole('button', { name: 'Continue to Instagram' }),
    );

    expect(windowOpen).toHaveBeenCalledWith(
      'https://www.instagram.com/',
      '_blank',
      'noopener,noreferrer',
    );
    expect(window.localStorage.getItem('wishwe-skip-instagram-notice')).toBe(
      'true',
    );

    windowOpen.mockClear();
    stories.addEventListener('click', clickEvent =>
      clickEvent.preventDefault(),
    );
    fireEvent.click(stories);

    expect(
      screen.queryByRole('dialog', { name: 'Post to Instagram Stories' }),
    ).toBeNull();
    expect(windowOpen).toHaveBeenCalledWith(
      'https://www.instagram.com/',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('closes the Instagram notice with Escape and returns focus to Stories', async () => {
    renderModal();

    await screen.findByRole('img', {
      name: 'Poster share image for Weekend trip',
    });

    const stories = screen.getByRole('link', { name: 'Stories' });

    fireEvent.click(stories);
    expect(
      screen.getByRole('dialog', { name: 'Post to Instagram Stories' }),
    ).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(
      screen.queryByRole('dialog', { name: 'Post to Instagram Stories' }),
    ).toBeNull();
    expect(document.activeElement).toBe(stories);
  });

  it('pulses the Instagram notice when the outer backdrop is clicked', async () => {
    renderModal();

    await screen.findByRole('img', {
      name: 'Poster share image for Weekend trip',
    });

    fireEvent.click(screen.getByRole('link', { name: 'Stories' }));

    const shareDialog = screen.getByRole('dialog', {
      name: 'Share this plan',
    });
    const noticeDialog = screen.getByRole('dialog', {
      name: 'Post to Instagram Stories',
    });
    const shareAnimate = vi.fn(
      () => ({ cancel: vi.fn() }) as unknown as Animation,
    );
    const noticeAnimate = vi.fn(
      () => ({ cancel: vi.fn() }) as unknown as Animation,
    );

    Object.defineProperty(shareDialog, 'animate', {
      configurable: true,
      value: shareAnimate,
    });
    Object.defineProperty(noticeDialog, 'animate', {
      configurable: true,
      value: noticeAnimate,
    });

    fireEvent.click(shareDialog.parentElement as HTMLElement);

    expect(noticeAnimate).toHaveBeenCalledTimes(1);
    expect(shareAnimate).not.toHaveBeenCalled();
  });

  it('uses the existing owner share link for every destination', async () => {
    renderModal(true);

    await waitFor(() => {
      const telegram = new URL(
        screen.getByRole('link', { name: 'Telegram' }).getAttribute('href')!,
      );

      expect(telegram.searchParams.get('url')).toBe(
        `${window.location.origin}/share/secret`,
      );
    });

    expect(mocks.createShareLink).toHaveBeenCalledTimes(1);
    expect(mocks.createShareLink).toHaveBeenCalledWith('42');
  });

  it('does not expose the protected fallback while an owner link loads', async () => {
    const shareLink = deferred<string>();

    mocks.createShareLink.mockReturnValueOnce(shareLink.promise);
    renderModal(true);

    const destinations = ['Telegram', 'WhatsApp', 'X', 'Facebook'];

    destinations.forEach(name => {
      const link = screen.getByRole('link', { name });

      expect(link.getAttribute('href')).toBe('#');
      expect(link.getAttribute('aria-disabled')).toBe('true');
    });

    fireEvent.click(screen.getByRole('link', { name: 'Telegram' }));
    expect(windowOpen).not.toHaveBeenCalled();

    shareLink.resolve('https://api.example.test/share/public-token');

    await waitFor(() => {
      const telegram = new URL(
        screen.getByRole('link', { name: 'Telegram' }).getAttribute('href')!,
      );

      expect(telegram.searchParams.get('url')).toBe(
        `${window.location.origin}/share/public-token`,
      );
    });

    destinations.forEach(name => {
      expect(
        screen.getByRole('link', { name }).getAttribute('aria-disabled'),
      ).toBe('false');
    });
  });

  it('keeps focus and uses the latest close callback', () => {
    const returnFocusRef = createRef<HTMLButtonElement>();
    const firstOnClose = vi.fn();
    const nextOnClose = vi.fn();
    const view = render(
      <ShareEventModal
        event={event}
        isOwn={false}
        onClose={firstOnClose}
        returnFocusRef={returnFocusRef}
      />,
    );
    const nextFormat = screen.getByRole('button', {
      name: 'Next share format',
    });

    nextFormat.focus();
    view.rerender(
      <ShareEventModal
        event={event}
        isOwn={false}
        onClose={nextOnClose}
        returnFocusRef={returnFocusRef}
      />,
    );

    expect(document.activeElement).toBe(nextFormat);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(firstOnClose).not.toHaveBeenCalled();
    expect(nextOnClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Close share dialog' }));

    expect(nextOnClose).toHaveBeenCalledTimes(1);
  });

  it('moves through formats with controls and the arrow keys', async () => {
    renderModal();

    await screen.findByRole('img', {
      name: 'Poster share image for Weekend trip',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next share format' }));

    expect(
      screen.getByRole('tab', { name: 'Card' }).getAttribute('aria-selected'),
    ).toBe('true');

    fireEvent.keyDown(document, { key: 'ArrowRight' });

    expect(
      screen.getByRole('tab', { name: 'Story' }).getAttribute('aria-selected'),
    ).toBe('true');

    fireEvent.keyDown(document, { key: 'ArrowLeft' });

    expect(
      screen.getByRole('tab', { name: 'Card' }).getAttribute('aria-selected'),
    ).toBe('true');
  });

  it('copies the selected PNG and announces confirmation', async () => {
    class TestClipboardItem {
      static supports = () => true;

      constructor(readonly data: Record<string, Blob | Promise<Blob>>) {}
    }

    vi.stubGlobal('ClipboardItem', TestClipboardItem);
    renderModal();

    const copyImage = await screen.findByRole('button', {
      name: 'Copy image',
    });

    await waitFor(() =>
      expect((copyImage as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(copyImage);

    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledTimes(1));

    const [items] = clipboardWrite.mock.calls[0] as [TestClipboardItem[]];

    expect(items[0].data['image/png']).toBeInstanceOf(Blob);
    expect(screen.getByRole('button', { name: 'Image copied!' })).toBeTruthy();
  });

  it('switches to download mode when PNG clipboard writing fails', async () => {
    class TestClipboardItem {
      static supports = () => true;

      constructor(readonly data: Record<string, Blob | Promise<Blob>>) {}
    }

    vi.stubGlobal('ClipboardItem', TestClipboardItem);
    clipboardWrite.mockRejectedValueOnce(new Error('permission denied'));
    renderModal();

    const copyImage = await screen.findByRole('button', {
      name: 'Copy image',
    });

    await waitFor(() =>
      expect((copyImage as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(copyImage);

    expect(
      await screen.findByText(
        'This browser can’t copy images — the PNG downloads instead.',
      ),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Download image' })).toBeTruthy();
  });

  it('opens Telegram in the specified popup without requiring an account', () => {
    renderModal();

    fireEvent.click(screen.getByRole('link', { name: 'Telegram' }));

    expect(windowOpen).toHaveBeenCalledWith(
      expect.stringContaining('https://t.me/share/url'),
      'wishwe-telegram-share',
      'popup,width=620,height=640,noopener,noreferrer',
    );
  });
});
