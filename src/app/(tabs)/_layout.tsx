import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { useT } from '@/i18n';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { t } = useT();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, tabBarHideOnKeyboard: true }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.today') }} />
      <Tabs.Screen name="progress" options={{ title: t('tabs.progress') }} />
      <Tabs.Screen name="fasting" options={{ title: t('tabs.fasting') }} />
      <Tabs.Screen name="coach" options={{ title: t('tabs.coach') }} />
    </Tabs>
  );
}
