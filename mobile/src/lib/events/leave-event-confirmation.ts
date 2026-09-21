import { leaveEventConfirmationCopy } from './leave-event-confirmation-copy';

export async function confirmLeaveEvent(isPlan: boolean): Promise<boolean> {
  const { title, message } = leaveEventConfirmationCopy(isPlan);
  const browser = globalThis.window;

  if (typeof browser?.confirm !== 'function') {
    return false;
  }

  return browser.confirm(`${title}\n\n${message}`);
}
