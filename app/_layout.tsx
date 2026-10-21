import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import { useMistakesStore } from "../src/hooks/useMistakesStore";
import { useBookmarksStore } from "../src/hooks/useBookmarksStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const loadMistakes = useMistakesStore((s) => s.loadMistakes);
  const loadBookmarks = useBookmarksStore((s) => s.loadBookmarks);

  useEffect(() => {
    loadMistakes();
    loadBookmarks();
  }, [loadMistakes, loadBookmarks]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? "#020617" : "#f8fafc" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="room/[testId]"
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="result/[testId]"
          options={{
            headerShown: false,
            gestureEnabled: false,
            animation: "fade",
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
