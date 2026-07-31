import Constants from 'expo-constants';

/**
 * Base URL for the Django API.
 *
 * Local defaults:
 * - iOS simulator: http://localhost:8000
 * - Android emulator: http://10.0.2.2:8000
 * - Physical device: http://<your-lan-ip>:8000
 */
const fromEnv = process.env.EXPO_PUBLIC_API_URL;
const fromExtra = Constants.expoConfig?.extra?.apiUrl as string | undefined;

export const API_URL = (fromEnv || fromExtra || 'http://localhost:8000').replace(/\/$/, '');
