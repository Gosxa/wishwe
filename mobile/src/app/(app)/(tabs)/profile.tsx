import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/auth';
import { Avatar } from '@/components/ui/avatar';
import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * Placeholder profile tab. The full profile is still under development, so this
 * only shows who is signed in and keeps sign-out reachable.
 */
export default function ProfileScreen() {
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

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.five }]}>
      <View style={styles.content}>
        <Avatar uri={profile?.avatar ?? null} size={88} style={styles.avatar} />

        <View style={styles.copy}>
          <Text style={styles.name}>{fullName || profile?.username || 'Your profile'}</Text>
          {profile?.username ? <Text style={styles.handle}>@{profile.username}</Text> : null}
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>coming soon</Text>
        </View>
        <Text style={styles.note}>
          Editing your profile and browsing your own plans are still under development.
        </Text>
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
    paddingBottom: Spacing.four,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  avatar: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copy: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: Colors.ink,
    textAlign: 'center',
  },
  handle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.muted,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: Spacing.one,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.ink,
    backgroundColor: Colors.accentYellow,
    marginTop: Spacing.three,
  },
  badgeLabel: {
    fontFamily: Fonts.accent,
    fontSize: 16,
    lineHeight: 16,
    color: Colors.ink,
    includeFontPadding: false,
  },
  note: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
});
