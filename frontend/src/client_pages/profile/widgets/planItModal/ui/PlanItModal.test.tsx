// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendEvent } from '@/shared/client_api/event';
import { useLoadingStore } from '@/shared/store/useLoadingStore';

const mocks = vi.hoisted(() => ({ convert: vi.fn() }));

vi.mock('@/shared/client_api/event', async importOriginal => ({
  ...(await importOriginal<typeof import('@/shared/client_api/event')>()),
  convertToPlan: mocks.convert,
}));

vi.mock('@/features/eventForm', async importOriginal => ({
  ...(await importOriginal<typeof import('@/features/eventForm')>()),
  EventTypePreview: () => null,
}));

import { PlanItModal } from './PlanItModal';

const wish = {
  id: 42,
  title: 'See the northern lights',
  min_participants: 2,
  cover_image: null,
} as BackendEvent;

describe('wish to plan transition', () => {
  const onConverted = vi.fn();
  const onClose = vi.fn();
  const setLoading = vi.fn();
  let resolveConversion: (value: BackendEvent) => void;
  let rejectConversion: (reason: Error) => void;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
    useLoadingStore.setState({ isLoading: false, setLoading });
    mocks.convert.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          resolveConversion = resolve;
          rejectConversion = reject;
        }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const setup = () => {
    const view = render(
      <PlanItModal event={wish} onClose={onClose} onConverted={onConverted} />,
    );

    fireEvent.change(screen.getByLabelText('Event date'), {
      target: { value: '2099-01-02' },
    });
    fireEvent.change(screen.getByLabelText('Event time'), {
      target: { value: '14:30' },
    });
    const share = screen.getByRole('button', {
      name: 'Share',
    }) as HTMLButtonElement;

    share.focus();
    fireEvent.click(share);

    return { ...view, share };
  };

  const advance = async (ms: number) => {
    await act(async () => vi.advanceTimersByTimeAsync(ms));
  };

  const resolve = async () => {
    await act(async () => resolveConversion(wish));
  };

  it('does not animate or submit an invalid schedule', () => {
    render(
      <PlanItModal event={wish} onClose={onClose} onConverted={onConverted} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(screen.queryByTestId('plan-conversion-transition')).toBeNull();
    expect(mocks.convert).not.toHaveBeenCalled();
    expect(screen.getByText('Date is required')).toBeTruthy();
  });

  it('assembles the chosen date, then confirms success before refreshing', async () => {
    const { share } = setup();
    const overlay = screen.getByTestId('plan-conversion-transition');

    expect(overlay.dataset.state).toBe('converting');
    expect(document.activeElement).toBe(overlay);
    expect(share.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(setLoading).not.toHaveBeenCalled();
    expect(overlay.textContent).toContain('Jan');
    expect(overlay.textContent).toContain('14:30');

    fireEvent.keyDown(overlay, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(share);
    expect(mocks.convert).toHaveBeenCalledOnce();

    await resolve();
    await advance(899);
    expect(overlay.dataset.state).toBe('converting');
    expect(onConverted).not.toHaveBeenCalled();
    await advance(1);
    expect(overlay.dataset.state).toBe('success');
    expect(screen.getByRole('status').textContent).toContain('January 2, 2099');
    expect(share.disabled).toBe(true);
    await advance(1500);
    expect(overlay.dataset.state).toBe('success');
    expect(onConverted).not.toHaveBeenCalled();
    await advance(1999);
    expect(onConverted).not.toHaveBeenCalled();
    await advance(1);
    expect(overlay.dataset.state).toBe('closing');
    expect(overlay.textContent).toContain('Someday just got a date.');
    expect(share.closest('[hidden]')).toBeTruthy();
    expect(share.disabled).toBe(true);
    await advance(299);
    expect(onConverted).not.toHaveBeenCalled();
    await advance(1);
    expect(onConverted).toHaveBeenCalledOnce();
  });

  it('never shows success while a slow request is still pending', async () => {
    setup();
    await advance(10000);
    expect(screen.getByTestId('plan-conversion-transition').dataset.state).toBe(
      'converting',
    );
    expect(onConverted).not.toHaveBeenCalled();
    await resolve();
    await advance(1);
    expect(screen.getByTestId('plan-conversion-transition').dataset.state).toBe(
      'success',
    );
    await advance(3800);
    expect(onConverted).toHaveBeenCalledOnce();
  });

  it('returns immediately to the populated form on failure and allows retry', async () => {
    const { share } = setup();

    await act(async () => rejectConversion(new Error('offline')));

    expect(screen.queryByTestId('plan-conversion-transition')).toBeNull();
    expect(
      screen.getByText('Something went wrong. Please try again.'),
    ).toBeTruthy();
    expect(
      (screen.getByLabelText('Event date') as HTMLInputElement).value,
    ).toBe('2099-01-02');
    expect(document.activeElement).toBe(share);
    expect(share.disabled).toBe(false);
    fireEvent.click(share);
    await resolve();
    await advance(4700);
    expect(mocks.convert).toHaveBeenCalledTimes(2);
    expect(onConverted).toHaveBeenCalledOnce();
  });

  it('skips the assembly delay and shortens confirmation for reduced motion', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    setup();
    await resolve();
    await advance(1);
    expect(screen.getByTestId('plan-conversion-transition').dataset.state).toBe(
      'success',
    );
    await advance(120);
    expect(onConverted).toHaveBeenCalledOnce();
  });

  it.each(['pending', 'assembling', 'success', 'closing'] as const)(
    'cleans up when unmounted during %s',
    async phase => {
      const { unmount } = setup();

      if (phase !== 'pending') await resolve();
      if (phase === 'success') await advance(900);
      if (phase === 'closing') await advance(4400);
      unmount();
      if (phase === 'pending') await resolve();
      await advance(10000);
      expect(onConverted).not.toHaveBeenCalled();
    },
  );
});
