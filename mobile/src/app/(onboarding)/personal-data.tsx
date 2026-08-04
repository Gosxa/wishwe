import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { AuthScreen, AvatarPicker, PrimaryButton, TextField } from '@/components/auth';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api/client';
import { isUsernameAvailable, submitOnboarding, uploadAvatar } from '@/lib/api/profile';
import { useAuth } from '@/lib/auth/auth-context';
import { USERNAME_HELPER_TEXT, validateUsername } from '@/lib/auth/username';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

type PickedAvatar = {
  uri: string;
  mimeType: string | null;
};

export default function PersonalDataScreen() {
  const { profile, refreshProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState<PickedAvatar | null>(null);

  const [savedUsername, setSavedUsername] = useState<string | null>(null);
  const [savedFirstName, setSavedFirstName] = useState('');
  const [savedLastName, setSavedLastName] = useState('');
  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [isUnique, setIsUnique] = useState(false);
  const [avatarError, setAvatarError] = useState<string | undefined>();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const checkUsername = async (value: string): Promise<boolean> => {
    const formatError = validateUsername(value);

    if (formatError) {
      setUsernameError(formatError);
      setIsUnique(false);
      return false;
    }

    try {
      if (await isUsernameAvailable(value)) {
        setUsernameError(undefined);
        setIsUnique(true);
        return true;
      }

      setUsernameError('Nickname is already taken. Please, choose another one');
      setIsUnique(false);
      return false;
    } catch {
      setUsernameError('Service temporarily unavailable');
      setIsUnique(false);
      return false;
    }
  };

  const onPickAvatar = async () => {
    setAvatarError(undefined);
    setAvatarFailed(false);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setAvatarError('Allow photo access to add a picture. You can also continue without one.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (!asset) return;

    if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
      setAvatarError('That picture is larger than 5MB. Please choose a smaller one.');
      return;
    }

    setAvatar({ uri: asset.uri, mimeType: asset.mimeType ?? null });
  };

  const onSubmit = async () => {
    if (loading) return;

    setSubmitError(undefined);

    const trimmed = username.trim().toLowerCase();
    setUsername(trimmed);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const alreadySaved =
      savedUsername === trimmed &&
      savedFirstName === trimmedFirstName &&
      savedLastName === trimmedLastName;

    if (!alreadySaved && !(await checkUsername(trimmed))) return;

    setLoading(true);
    let saved = alreadySaved;

    try {
      if (!alreadySaved) {
        await submitOnboarding({
          username: trimmed,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
        });
        saved = true;
        setSavedUsername(trimmed);
        setSavedFirstName(trimmedFirstName);
        setSavedLastName(trimmedLastName);
      }

      if (avatar) {
        try {
          await uploadAvatar(avatar.uri, avatar.mimeType);
          setAvatarFailed(false);
        } catch (e) {
          setAvatarError(
            e instanceof ApiError ? e.message : 'The picture could not be uploaded.',
          );
          setAvatarFailed(true);
          setLoading(false);
          return;
        }
      }

      await refreshProfile();
    } catch (e) {
      setSubmitError(
        saved
          ? 'Your profile was saved, but loading it failed. Please tap "Let\'s go" again.'
          : e instanceof ApiError
            ? e.message
            : 'Service temporarily unavailable',
      );
      setLoading(false);
    }
  };

  /** Keeps the saved details and moves on, leaving the picture for later. */
  const onSkipPhoto = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await refreshProfile();
    } catch {
      setSubmitError('Service temporarily unavailable');
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      title="Tell us about you"
      headline={`Set up the profile for ${profile?.user ?? 'your account'}. You can change it later.`}
    >
      <AvatarPicker
        uri={avatar?.uri ?? null}
        onPick={onPickAvatar}
        onRemove={() => {
          setAvatar(null);
          setAvatarError(undefined);
          setAvatarFailed(false);
        }}
        disabled={loading}
        error={avatarError}
      />

      <TextField
        label="Your nickname"
        required
        value={username}
        onChangeText={(text) => {
          setUsername(text.toLowerCase());
          setUsernameError(undefined);
          setIsUnique(false);
        }}
        onBlur={() => {
          if (username.trim()) checkUsername(username.trim());
        }}
        placeholder="e.g. helloworlddb"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        returnKeyType="next"
        editable={!loading}
        error={usernameError}
        helperText={isUnique ? 'The nickname is unique' : USERNAME_HELPER_TEXT}
        isSuccess={isUnique}
      />

      <TextField
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Mariia"
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
        editable={!loading}
      />

      <TextField
        label="Last Name"
        value={lastName}
        onChangeText={setLastName}
        placeholder="Shevchenko"
        autoCapitalize="words"
        autoComplete="family-name"
        textContentType="familyName"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        editable={!loading}
      />

      {submitError ? <Text style={styles.error}>{submitError}</Text> : null}

      <PrimaryButton
        label={avatarFailed ? 'Try the photo again' : "Let's go"}
        onPress={onSubmit}
        loading={loading}
        disabled={!username.trim()}
        style={styles.submit}
      />

      {avatarFailed ? (
        <Pressable
          onPress={onSkipPhoto}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Continue without a photo"
          style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
        >
          <Text style={styles.skipLabel}>Continue without a photo</Text>
        </Pressable>
      ) : null}
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  submit: {
    marginTop: Spacing.two,
  },
  error: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  pressed: {
    opacity: 0.65,
  },
  skipLabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
