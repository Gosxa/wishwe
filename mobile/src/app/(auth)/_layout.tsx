import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { AuthFlowProvider } from '@/lib/auth-flow';

export default function AuthLayout() {
  return (
    <AuthFlowProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.cream },
          animation: 'slide_from_right',
        }}
      />
    </AuthFlowProvider>
  );
}
