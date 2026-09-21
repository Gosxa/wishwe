import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { leaveEventConfirmationCopy } from '@/lib/events/leave-event-confirmation-copy';

const alerts = vi.hoisted(() => ({
  alert: vi.fn(),
}));

vi.mock('react-native', () => ({
  Alert: { alert: alerts.alert },
}));

type AlertButton = {
  text: string;
  style?: string;
  onPress?: () => void;
};

type AlertOptions = {
  cancelable?: boolean;
  onDismiss?: () => void;
};

function lastAlert() {
  const [title, message, buttons, options] = alerts.alert.mock.calls.at(-1) as [
    string,
    string,
    AlertButton[],
    AlertOptions,
  ];

  return { title, message, buttons, options };
}

function buttonLabeled(label: string): AlertButton {
  const button = lastAlert().buttons.find((candidate) => candidate.text === label);

  if (!button) {
    throw new Error(`The system dialog has no "${label}" button.`);
  }

  return button;
}

beforeEach(() => {
  alerts.alert.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('leaveEventConfirmationCopy', () => {
  it('offers to remove an interest on a wish', () => {
    expect(leaveEventConfirmationCopy(false)).toEqual({
      title: 'Remove your interest?',
      message: 'This wish will stop showing you as interested.',
      cancelLabel: 'Stay',
      confirmLabel: 'Remove',
    });
  });

  it('warns that leaving a plan costs the spot', () => {
    expect(leaveEventConfirmationCopy(true)).toEqual({
      title: 'Leave this plan?',
      message: 'You will lose your spot and the host will see that you left.',
      cancelLabel: 'Stay',
      confirmLabel: 'Leave',
    });
  });
});

describe('confirmLeaveEvent on native platforms', () => {
  it('shows the system dialog instead of custom in-app UI', async () => {
    const { confirmLeaveEvent } = await import('@/lib/events/leave-event-confirmation.native');
    const pending = confirmLeaveEvent(false);

    const { title, message, buttons, options } = lastAlert();

    expect(title).toBe('Remove your interest?');
    expect(message).toBe('This wish will stop showing you as interested.');
    expect(buttons.map((button) => [button.text, button.style])).toEqual([
      ['Stay', 'cancel'],
      ['Remove', 'destructive'],
    ]);
    expect(options.cancelable).toBe(true);

    buttonLabeled('Remove').onPress?.();

    await expect(pending).resolves.toBe(true);
  });

  it('keeps the interest when the user stays', async () => {
    const { confirmLeaveEvent } = await import('@/lib/events/leave-event-confirmation.native');
    const pending = confirmLeaveEvent(false);

    buttonLabeled('Stay').onPress?.();

    await expect(pending).resolves.toBe(false);
  });

  it('treats a dismissed Android dialog as staying', async () => {
    const { confirmLeaveEvent } = await import('@/lib/events/leave-event-confirmation.native');
    const pending = confirmLeaveEvent(false);

    lastAlert().options.onDismiss?.();

    await expect(pending).resolves.toBe(false);
  });

  it('never resolves twice when a dismissal follows a button press', async () => {
    const { confirmLeaveEvent } = await import('@/lib/events/leave-event-confirmation.native');
    const pending = confirmLeaveEvent(true);

    buttonLabeled('Leave').onPress?.();
    lastAlert().options.onDismiss?.();

    await expect(pending).resolves.toBe(true);
  });
});

describe('confirmLeaveEvent on web', () => {
  it('uses the browser confirmation window', async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal('window', { confirm });
    const { confirmLeaveEvent } = await import('@/lib/events/leave-event-confirmation');

    await expect(confirmLeaveEvent(true)).resolves.toBe(true);
    expect(confirm).toHaveBeenCalledWith(
      'Leave this plan?\n\nYou will lose your spot and the host will see that you left.',
    );
  });

  it('stays on the event when the browser has no confirmation window', async () => {
    vi.stubGlobal('window', undefined);
    const { confirmLeaveEvent } = await import('@/lib/events/leave-event-confirmation');

    await expect(confirmLeaveEvent(true)).resolves.toBe(false);
  });
});
