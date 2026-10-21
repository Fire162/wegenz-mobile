import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: isDark ? "#090d16" : "#ffffff",
        },
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 18,
          color: isDark ? "#f8fafc" : "#0f172a",
        },
        tabBarStyle: {
          backgroundColor: isDark ? "#090d16" : "#ffffff",
          borderTopColor: isDark ? "#1e293b" : "#e2e8f0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: isDark ? "#64748b" : "#94a3b8",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Practice",
          headerTitle: "Wegenz Practice",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="error-vault"
        options={{
          title: "Error Vault",
          headerTitle: "Mistake Notebook",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          title: "Saved",
          headerTitle: "Saved Questions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
