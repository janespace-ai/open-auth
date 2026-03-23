import { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAgentsStore } from "../../stores/agents";
import { useHistoryStore } from "../../stores/history";
import {
  getCapabilityDisplayName,
  getActionDisplayName,
  formatTimestamp,
} from "../../utils/display";

export default function AgentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const agent = useAgentsStore((s) => s.getAgent)(id!);
  const removeAgent = useAgentsStore((s) => s.removeAgent);
  const agentHistory = useHistoryStore((s) => s.getByAgent)(id!);

  const stats = useMemo(() => {
    const approved = agentHistory.filter((r) => r.status === "approved").length;
    const rejected = agentHistory.filter((r) => r.status === "rejected").length;
    return { total: agentHistory.length, approved, rejected };
  }, [agentHistory]);

  const recentActivity = useMemo(
    () => agentHistory.slice(0, 5),
    [agentHistory],
  );

  const handleUnpair = () => {
    Alert.alert(
      "Unpair Agent",
      `Are you sure you want to unpair "${agent?.name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unpair",
          style: "destructive",
          onPress: () => {
            removeAgent(id!);
            router.back();
          },
        },
      ],
    );
  };

  if (!agent) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <Text className="text-gray-400 text-base">Agent not found</Text>
      </View>
    );
  }

  const isOnline = agent.status === "online";

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="bg-white px-5 pt-14 pb-4">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900 flex-1" numberOfLines={1}>
            {agent.name}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View
                className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  isOnline ? "bg-green-500" : "bg-gray-300"
                }`}
              />
              <Text
                className={`text-sm font-medium ${
                  isOnline ? "text-green-600" : "text-gray-400"
                }`}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
          <InfoRow label="Device" value={agent.deviceType} />
          <InfoRow
            label="Paired"
            value={new Date(agent.pairedAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          />
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-900 mb-3">
            Capabilities
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {agent.capabilities.map((cap) => (
              <View key={cap} className="bg-blue-50 px-3 py-1.5 rounded-full">
                <Text className="text-xs font-medium text-blue-700">
                  {getCapabilityDisplayName(cap)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-gray-900 mb-3">
            Statistics
          </Text>
          <View className="flex-row justify-between">
            <StatBox label="Total" value={stats.total} color="text-gray-900" />
            <StatBox label="Approved" value={stats.approved} color="text-green-600" />
            <StatBox label="Rejected" value={stats.rejected} color="text-red-600" />
          </View>
        </View>

        {recentActivity.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-gray-900 mb-3">
              Recent Activity
            </Text>
            {recentActivity.map((item) => {
              const isApproved = item.status === "approved";
              return (
                <View
                  key={item.id}
                  className="flex-row items-center py-2.5 border-b border-gray-50"
                >
                  <Ionicons
                    name={isApproved ? "checkmark-circle" : "close-circle"}
                    size={18}
                    color={isApproved ? "#16A34A" : "#DC2626"}
                  />
                  <Text className="flex-1 text-sm text-gray-700 ml-2.5" numberOfLines={1}>
                    {getActionDisplayName(item.action)}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <Pressable
          onPress={handleUnpair}
          className="bg-red-50 rounded-2xl py-4 items-center mt-2"
        >
          <Text className="text-red-600 font-semibold text-base">
            Unpair Agent
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-gray-50">
      <Text className="text-sm text-gray-400">{label}</Text>
      <Text className="text-sm font-medium text-gray-700">{value}</Text>
    </View>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View className="items-center flex-1">
      <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
      <Text className="text-xs text-gray-400 mt-1">{label}</Text>
    </View>
  );
}
