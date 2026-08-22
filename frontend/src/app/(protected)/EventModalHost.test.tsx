// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({
  close: vi.fn(),
  eventId: null as string | null,
}));

vi.mock('@/shared/store/useEventModalStore', () => ({
  useEventModalStore: (
    selector: (state: { eventId: string | null; close: () => void }) => unknown,
  ) => selector(store),
}));

vi.mock('@client_pages/home/widgets/feed/ui/DeepLinkCard', () => ({
  DeepLinkCard: ({
    eventId,
    onClose,
  }: {
    eventId: string;
    onClose: () => void;
  }) => (
    <section aria-label={`Event ${eventId}`}>
      <button type="button" onClick={onClose}>
        Close event
      </button>
    </section>
  ),
}));

import { EventModalHost } from './EventModalHost';

describe('EventModalHost', () => {
  beforeEach(() => {
    store.eventId = null;
    store.close.mockReset();
  });

  afterEach(cleanup);

  it('does not mount a modal without a selected event', () => {
    render(<EventModalHost />);

    expect(screen.queryByRole('region')).toBeNull();
  });

  it('renders the selected event and wires its close action to the store', () => {
    store.eventId = 'event-42';
    render(<EventModalHost />);

    expect(screen.getByRole('region', { name: 'Event event-42' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close event' }));
    expect(store.close).toHaveBeenCalledTimes(1);
  });
});
