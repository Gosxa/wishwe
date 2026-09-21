import { Alert } from 'react-native';

import { leaveEventConfirmationCopy } from './leave-event-confirmation-copy';

export function confirmLeaveEvent(isPlan: boolean): Promise<boolean> {
  const { title, message, cancelLabel, confirmLabel } =
    leaveEventConfirmationCopy(isPlan);

  return new Promise((resolve) => {
    let isSettled = false;

    const settle = (confirmed: boolean) => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      resolve(confirmed);
    };

    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => settle(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => settle(true) },
      ],
      { cancelable: true, onDismiss: () => settle(false) }
    );
  });
}
