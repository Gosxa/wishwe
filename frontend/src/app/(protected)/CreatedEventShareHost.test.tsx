// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendEvent } from '@/shared/client_api/event';
import { useCreatedEventShareStore } from '@/shared/store/useCreatedEventShareStore';

const mocks = vi.hoisted(() => ({
  toFeedEvents: vi.fn(),
}));

vi.mock('@client_pages/home/model/feedMapper', () => ({
  toFeedEvents: mocks.toFeedEvents,
}));

vi.mock('@client_pages/home/widgets/feed/ui/ShareEventModal', () => ({
  ShareEventModal: ({
    event,
    celebrateArrival,
    onClose,
  }: {
    event: { title: string };
    celebrateArrival?: boolean;
    onClose: () => void;
  }) => (
    <div role="dialog" aria-label="Share created event">
      <span>{event.title}</span>
      <span>{celebrateArrival ? 'celebrated' : 'plain'}</span>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

import { CreatedEventShareHost } from './CreatedEventShareHost';

const createdEvent = { id: 42 } as BackendEvent;
const feedEvent = { title: 'Coffee meetup' };

describe('CreatedEventShareHost', () => {
  beforeEach(() => {
    useCreatedEventShareStore.getState().close();
    mocks.toFeedEvents.mockReturnValue([feedEvent]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('opens the celebratory share modal for a newly created event', () => {
    useCreatedEventShareStore.getState().open(createdEvent);

    render(<CreatedEventShareHost />);

    expect(
      screen.getByRole('dialog', { name: 'Share created event' }),
    ).toBeTruthy();
    expect(screen.getByText('Coffee meetup')).toBeTruthy();
    expect(screen.getByText('celebrated')).toBeTruthy();
    expect(mocks.toFeedEvents).toHaveBeenCalledWith([createdEvent]);
  });

  it('closes the modal when requested', () => {
    useCreatedEventShareStore.getState().open(createdEvent);

    render(<CreatedEventShareHost />);
    screen.getByRole('button', { name: 'Close' }).click();

    expect(useCreatedEventShareStore.getState().event).toBeNull();
  });
});
