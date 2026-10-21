import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useSyncExternalStore } from 'react';

import { Toast } from '@/components/toast';
import { useT } from '@/i18n';
import { useHydrated, useStore } from '@/store/store';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

const modal = { presentation: 'modal' } as const;
const subscribeNoop = () => () => {};

export default function RootLayout() {
  const hydrated = useHydrated();
  const hasProfile = useStore((s) => s.profile !== null);
  // Data lives on the device, so the web server render must match the first client render (empty).
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  useT(); // re-render the navigator when the language changes

  useEffect(() => {
    if (hydrated && mounted) void SplashScreen.hideAsync();
  }, [hydrated, mounted]);

  if (!hydrated || !mounted) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!hasProfile}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={hasProfile}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="add"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.75],
              sheetGrabberVisible: true,
              sheetCornerRadius: 28,
            }}
          />
          <Stack.Screen
            name="streak"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.55],
              sheetGrabberVisible: true,
              sheetCornerRadius: 28,
            }}
          />
          <Stack.Screen name="search" options={modal} />
          <Stack.Screen name="food-entry" options={modal} />
          <Stack.Screen name="barcode" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="manual" options={modal} />
          <Stack.Screen name="saved" options={modal} />
          <Stack.Screen name="exercise" options={modal} />
          <Stack.Screen name="water" options={modal} />
          <Stack.Screen name="weight" options={modal} />
          <Stack.Screen name="fasting-plans" options={modal} />
          <Stack.Screen name="fasting-info" options={modal} />
          <Stack.Screen name="meal/[id]" />
          <Stack.Screen name="goals" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="recipes/index" />
          <Stack.Screen name="recipes/[id]" />
        </Stack.Protected>
      </Stack>
      <Toast />
    </>
  );
}
