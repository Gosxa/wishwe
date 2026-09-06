import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
  const plugins = [...(config.plugins ?? [])];

  if (googleIosClientId) {
    if (!/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(googleIosClientId)) {
      throw new Error(
        'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID must be an iOS OAuth client ID ' +
          'ending in .apps.googleusercontent.com.',
      );
    }

    plugins.push([
      '@react-native-google-signin/google-signin',
      { iosUrlScheme: googleIosClientId.split('.').reverse().join('.') },
    ]);
  }

  return {
    ...config,
    name: config.name ?? 'WishWe',
    slug: config.slug ?? 'wishwe',
    plugins,
  };
};
