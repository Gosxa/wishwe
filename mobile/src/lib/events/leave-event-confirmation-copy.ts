export type LeaveEventConfirmationCopy = {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
};


export function leaveEventConfirmationCopy(
  isPlan: boolean,
): LeaveEventConfirmationCopy {
  return {
    title: isPlan ? 'Leave this plan?' : 'Remove your interest?',
    message: isPlan
      ? 'You will lose your spot and the host will see that you left.'
      : 'This wish will stop showing you as interested.',
    cancelLabel: 'Stay',
    confirmLabel: isPlan ? 'Leave' : 'Remove',
  };
}
