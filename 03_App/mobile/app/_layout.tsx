import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { DbProvider } from "@/db";

export default function RootLayout() {
  return (
    <DbProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </DbProvider>
  );
}