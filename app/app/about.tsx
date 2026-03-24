import { View, Text, Pressable, ScrollView } from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const HELP_LINKS = [
  { label: "Getting Started", icon: "rocket-outline" as const },
  { label: "Pairing Guide", icon: "link-outline" as const },
  { label: "Security Model", icon: "shield-checkmark-outline" as const },
  { label: "FAQ", icon: "help-circle-outline" as const },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy" },
  { label: "Terms of Service" },
  { label: "Open Source Licenses" },
];

export default function AboutScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="bg-white px-5 pt-14 pb-4">
        <View className="flex-row items-center">
          <Pressable
            testID="about-back"
            onPress={() => router.back()}
            className="mr-3 p-1"
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">About</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <View className="items-center py-6 mb-4">
          <View className="w-16 h-16 rounded-2xl bg-blue-600 items-center justify-center mb-3">
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
          </View>
          <Text className="text-xl font-bold text-gray-900">Open Auth</Text>
          <Text className="text-sm text-gray-400 mt-1">Version 1.0.0</Text>
        </View>

        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 ml-1">
          Help
        </Text>
        <View className="bg-white rounded-2xl mb-5 overflow-hidden">
          {HELP_LINKS.map((link, i) => (
            <Pressable
              key={link.label}
              className={`flex-row items-center px-4 py-3.5 ${
                i < HELP_LINKS.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <Ionicons name={link.icon} size={20} color="#6B7280" />
              <Text className="flex-1 text-base text-gray-900 ml-3">
                {link.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 ml-1">
          Legal
        </Text>
        <View className="bg-white rounded-2xl mb-5 overflow-hidden">
          {LEGAL_LINKS.map((link, i) => (
            <Pressable
              key={link.label}
              className={`flex-row items-center justify-between px-4 py-3.5 ${
                i < LEGAL_LINKS.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <Text className="text-base text-gray-900">{link.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          ))}
        </View>

        <Text className="text-center text-sm text-gray-300 mt-6">
          Made with ♥ for a more secure AI future
        </Text>
      </ScrollView>
    </View>
  );
}
