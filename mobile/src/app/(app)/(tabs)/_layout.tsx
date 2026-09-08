import { Tabs } from 'expo-router/js-tabs';

import { TabBar, type TabBarItem } from '@/components/tab-bar';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth/auth-context';

const LABELS: Record<string, string> = {
  index: 'Home',
  friends: 'Friends',
  create: 'Create',
  activity: 'Activity',
  profile: 'Profile',
};

export default function TabsLayout() {
  const { profile } = useAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Colors.cream },
      }}
      tabBar={({ state, navigation }) => {
        const items: TabBarItem[] = state.routes.map((route, index) => ({
          name: route.name,
          label: LABELS[route.name] ?? route.name,
          isFocused: state.index === index,
          onPress: () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (state.index !== index && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          },
        }));

        return <TabBar items={items} avatarUri={profile?.avatar ?? null} />;
      }}
    >
      <Tabs.Screen name="index" options={{ title: LABELS.index }} />
      <Tabs.Screen name="friends" options={{ title: LABELS.friends }} />
      <Tabs.Screen name="create" options={{ title: LABELS.create }} />
      <Tabs.Screen name="activity" options={{ title: LABELS.activity }} />
      <Tabs.Screen name="profile" options={{ title: LABELS.profile }} />
    </Tabs>
  );
}
