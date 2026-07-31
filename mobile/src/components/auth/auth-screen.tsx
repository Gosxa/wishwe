import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackLink } from '@/components/auth/back-link';
import { Colors, Fonts, Spacing } from '@/constants/theme';

type Props = {
  title: string;
  headline: string;
  children: ReactNode;
  backLabel?: string;
  onBack?: () => void;
  footer?: ReactNode;
};

export function AuthScreen({ title, headline, children, backLabel, onBack, footer }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.five }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, Spacing.four) + Spacing.four },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.headline}>{headline}</Text>
          </View>

          <View style={styles.form}>{children}</View>

          {backLabel && onBack ? (
            <View style={styles.back}>
              <BackLink label={backLabel} onPress={onBack} />
            </View>
          ) : null}

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.six,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.ink,
  },
  headline: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22.4,
    color: Colors.muted,
  },
  form: {
    gap: Spacing.three,
  },
  back: {
    marginTop: Spacing.four,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: Spacing.six,
  },
});
