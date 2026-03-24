import { useCallback } from "react";
import { View, Text, Pressable, FlatList, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAgentsStore } from "../../stores/agents";
import { useRequestsStore } from "../../stores/requests";
import { getCapabilityDisplayName, formatTimestamp } from "../../utils/display";
import type { Agent } from "../../services/types";

function AgentCard({
  agent,
  pendingCount,
}: {
  agent: Agent;
  pendingCount: number;
}) {
  return (
    <Pressable
      className="bg-white rounded-2xl mx-4 mb-3 p-4 shadow-sm border border-gray-100"
      style={{ elevation: 1 }}
      onPress={() => router.push(`/agent/${agent.id}`)}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
            <Ionicons name="hardware-chip-outline" size={20} color="#2563EB" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900">
              {agent.name}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  agent.status === "online" ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <Text className="text-xs text-gray-500 capitalize">
                {agent.status}
              </Text>
              <Text className="text-xs text-gray-400 mx-1.5">·</Text>
              <Text className="text-xs text-gray-500">
                Paired {formatTimestamp(agent.pairedAt)}
              </Text>
            </View>
          </View>
        </View>

        {pendingCount > 0 && (
          <View className="bg-red-500 rounded-full min-w-[22px] h-[22px] items-center justify-center px-1.5">
            <Text className="text-white text-xs font-bold">{pendingCount}</Text>
          </View>
        )}
      </View>

      <View className="flex-row flex-wrap mt-1 gap-1.5">
        {agent.capabilities.map((cap) => (
          <View key={cap} className="bg-blue-50 rounded-full px-2.5 py-1">
            <Text className="text-xs text-blue-700 font-medium">
              {getCapabilityDisplayName(cap)}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-6">
        <Ionicons name="people-outline" size={48} color="#9CA3AF" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2">
        No agents paired yet
      </Text>
      <Text className="text-sm text-gray-500 text-center mb-8">
        Pair an AI agent to authorize its actions securely from your device.
      </Text>
      <Pressable
        className="bg-blue-600 rounded-xl px-8 py-3.5 active:bg-blue-700"
        onPress={() => router.push("/pair")}
      >
        <Text className="text-white font-semibold text-base">
          Pair New Agent
        </Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const agents = useAgentsStore((s) => s.agents);
  const pending = useRequestsStore((s) => s.pending);

  const pendingCountByAgent = useCallback(
    (agentId: string) => pending.filter((r) => r.agentId === agentId).length,
    [pending],
  );

  const onRefresh = useCallback(() => {}, []);

  if (agents.length === 0) {
    return (
      <View className="flex-1 bg-gray-50">
        <EmptyState />
      </View>
    );
  }

  const firstPendingId = pending[0]?.requestId;

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          pending.length > 0 && firstPendingId ? (
            <Pressable
              testID="pending-auth-banner"
              onPress={() => router.push(`/request/${firstPendingId}`)}
              className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row items-center justify-between active:bg-amber-100"
            >
              <View className="flex-1 pr-2">
                <Text className="text-sm font-semibold text-amber-900">
                  {pending.length} pending authorization
                  {pending.length > 1 ? "s" : ""}
                </Text>
                <Text className="text-xs text-amber-800 mt-0.5">
                  Tap to review the next request
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#b45309" />
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <AgentCard agent={item} pendingCount={pendingCountByAgent(item.id)} />
        )}
      />

      <Pressable
        testID="fab-pair"
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg active:bg-blue-700"
        style={{ elevation: 4 }}
        onPress={() => router.push("/pair")}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
