import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/auth";
import { useHistoryStore } from "../../stores/history";
import { useAgentsStore } from "../../stores/agents";

export default function SettingsScreen() {
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);
  const resetAuth = useAuthStore((s) => s.reset);
  const resetHistory = useHistoryStore((s) => s.reset);
  const resetAgents = useAgentsStore((s) => s.reset);

  const [autoLockTimeout] = useState("5 minutes");

  const handleResetAll = () => {
    Alert.alert(
      "Reset All Data",
      "Are you sure? All agents, history, and settings will be erased.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "This Cannot Be Undone",
              "All data will be permanently deleted. Are you absolutely sure?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Reset Everything",
                  style: "destructive",
                  onPress: () => {
                    resetAuth();
                    resetHistory();
                    resetAgents();
                    router.replace("/onboarding");
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <SectionHeader title="Security" />
        <View className="bg-white rounded-2xl mb-5 overflow-hidden">
          <SettingRow label="Change PIN" onPress={() => {}} />
          <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-gray-50">
            <Text className="text-base text-gray-900">
              Biometric Authentication
            </Text>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: "#D1D5DB", true: "#3B82F6" }}
              thumbColor="#FFFFFF"
            />
          </View>
          <SettingRow
            label="Auto-Lock Timeout"
            value={autoLockTimeout}
            onPress={() => {}}
          />
        </View>

        <SectionHeader title="Backup" />
        <View className="bg-white rounded-2xl mb-5 overflow-hidden">
          <SettingRow label="Export Recovery Phrase" onPress={() => {}} />
          <SettingRow label="Import Recovery Phrase" onPress={() => {}} last />
        </View>

        <SectionHeader title="Auto-Approve Rules" />
        <View className="bg-white rounded-2xl mb-5 overflow-hidden">
          <Text className="text-xs text-gray-400 px-4 pt-3">
            Configure auto-approve rules for your agents
          </Text>
          <SettingRow label="Manage Rules" onPress={() => {}} last />
        </View>

        <SectionHeader title="Data" />
        <View className="bg-white rounded-2xl mb-5 overflow-hidden">
          <Pressable
            onPress={handleResetAll}
            className="flex-row items-center justify-between px-4 py-3.5"
          >
            <Text className="text-base text-red-600">Reset All Data</Text>
            <Ionicons name="chevron-forward" size={18} color="#DC2626" />
          </Pressable>
        </View>

        <SectionHeader title="About" />
        <View className="bg-white rounded-2xl mb-5 overflow-hidden">
          <SettingRow
            label="About Open Auth"
            onPress={() => router.push("/about")}
          />
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <Text className="text-base text-gray-900">App Version</Text>
            <Text className="text-sm text-gray-400">1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 ml-1">
      {title}
    </Text>
  );
}

function SettingRow({
  label,
  value,
  onPress,
  last,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-3.5 ${
        last ? "" : "border-b border-gray-50"
      }`}
    >
      <Text className="text-base text-gray-900">{label}</Text>
      <View className="flex-row items-center">
        {value && (
          <Text className="text-sm text-gray-400 mr-1">{value}</Text>
        )}
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
    </Pressable>
  );
}
