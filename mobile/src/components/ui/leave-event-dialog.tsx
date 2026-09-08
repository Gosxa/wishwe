import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  isPlan: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LeaveEventDialog({ visible, isPlan, isPending, onCancel, onConfirm }: Props) {
  const title = isPlan ? 'Leave this plan?' : 'Remove your interest?';
  const body = isPlan
    ? 'You will lose your spot and the host will see that you left.'
    : 'This wish will stop showing you as interested.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={isPending ? undefined : onCancel}
    >
      <Pressable
        style={styles.backdrop}
        onPress={isPending ? undefined : onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Pressable style={styles.dialog} onPress={() => {}} accessibilityViewIsModal>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={isPending}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelLabel}>Stay</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isPending}
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, styles.confirm, pressed && styles.pressed]}
            >
              {isPending ? (
                <ActivityIndicator color={Colors.cream} />
              ) : (
                <Text style={styles.confirmLabel}>{isPlan ? 'Leave' : 'Remove'}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 28, 30, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radii.lg,
    backgroundColor: Colors.cream,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 20,
    lineHeight: 25,
    color: Colors.ink,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.muted,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  cancel: {
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  cancelLabel: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.32,
    color: Colors.primary,
  },
  confirm: {
    backgroundColor: Colors.primary,
  },
  confirmLabel: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: 0.32,
    color: Colors.cream,
  },
});
