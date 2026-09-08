import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.cream },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="event/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
