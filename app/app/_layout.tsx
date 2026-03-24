import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { useAuthStore } from "../stores";

export default function RootLayout() {
  const { isOnboarded, isLocked } = useAuthStore();

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/(onboarding)");
    } else if (isLocked) {
      // TODO: replace with lock screen route once implemented
      router.replace("/(tabs)");
    } else {
      router.replace("/(tabs)");
    }
  }, [isOnboarded, isLocked]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pair" />
      <Stack.Screen name="agent/[id]" />
      <Stack.Screen name="request/[id]" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
