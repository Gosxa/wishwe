import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth';
import { Logo } from '@/components/logo';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-context';

/** TODO: Implement the home screen with the actual feed content. */
export default function HomeScreen() {
  const { profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + Spacing.five,
          paddingBottom: Math.max(insets.bottom, Spacing.four) + Spacing.four,
        },
      ]}
    >
      <View style={styles.content}>
        <Logo height={44} />

        {profile?.avatar ? (
          <Image
            source={{ uri: profile.avatar }}
            style={styles.avatar}
            accessibilityIgnoresInvertColors
          />
        ) : null}

        <View style={styles.copy}>
          <Text style={styles.title}>Logged In Successfully</Text>
          <Text style={styles.headline}>You are signed in to WishWe.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{profile?.user ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{profile?.username ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>
              {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Not set'}
            </Text>
          </View>
        </View>
      </View>

      <PrimaryButton label="Log out" onPress={onSignOut} loading={signingOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingHorizontal: Spacing.four,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.five,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copy: {
    gap: Spacing.two,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.ink,
    textAlign: 'center',
  },
  headline: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22.4,
    color: Colors.muted,
    textAlign: 'center',
  },
  card: {
    alignSelf: 'stretch',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.creamMuted,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  row: {
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  label: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.muted,
  },
  value: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.ink,
  },
});
