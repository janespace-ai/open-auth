import { useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useRequestsStore } from "../../stores/requests";
import { useAgentsStore } from "../../stores/agents";
import { useHistoryStore } from "../../stores/history";
import {
  getCapabilityDisplayName,
  getActionDisplayName,
  getRiskDisplay,
  truncateAddress,
  getChainName,
} from "../../utils/display";
import type { AuthRequest, HistoryRecord } from "../../services/types";

function ParamRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-gray-100">
      <Text className="text-sm text-gray-500">{label}</Text>
      <Text className="text-sm font-medium text-gray-900 ml-4 text-right flex-shrink">
        {value}
      </Text>
    </View>
  );
}

function EvmDetails({ request }: { request: AuthRequest }) {
  const params = request.params;
  const to = (params.to as string) ?? "";
  const value = params.value as string | number | undefined;
  const chainId = params.chainId as number | undefined;

  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
      <Text className="text-sm font-semibold text-gray-900 mb-2">
        Transaction Details
      </Text>
      {to ? <ParamRow label="To" value={truncateAddress(to)} /> : null}
      {value !== undefined ? (
        <ParamRow label="Amount" value={String(value)} />
      ) : null}
      {chainId !== undefined ? (
        <ParamRow label="Network" value={getChainName(chainId)} />
      ) : null}
      {params.data ? (
        <ParamRow
          label="Data"
          value={truncateAddress(String(params.data), 8)}
        />
      ) : null}
    </View>
  );
}

function GenericParams({ params }: { params: Record<string, unknown> }) {
  const entries = Object.entries(params);
  if (entries.length === 0) return null;

  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
      <Text className="text-sm font-semibold text-gray-900 mb-2">
        Parameters
      </Text>
      {entries.map(([key, val]) => (
        <ParamRow key={key} label={key} value={String(val)} />
      ))}
    </View>
  );
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getRequest = useRequestsStore((s) => s.getRequest);
  const removeRequest = useRequestsStore((s) => s.removeRequest);
  const getAgent = useAgentsStore((s) => s.getAgent);
  const addRecord = useHistoryStore((s) => s.addRecord);

  const request = getRequest(id ?? "");
  const agent = request ? getAgent(request.agentId) : undefined;

  const handleDecision = useCallback(
    (status: "approved" | "rejected") => {
      if (!request) return;

      const record: HistoryRecord = {
        id: `${request.requestId}-${Date.now()}`,
        requestId: request.requestId,
        agentId: request.agentId,
        agentName: agent?.name ?? "Unknown Agent",
        capability: request.capability,
        action: request.action,
        description: request.context.description,
        status,
        timestamp: Date.now(),
      };

      removeRequest(request.requestId);
      addRecord(record);
      router.back();
    },
    [request, agent, removeRequest, addRecord],
  );

  if (!request) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
        <Text className="text-gray-500 mt-3">Request not found</Text>
        <Pressable className="mt-4" onPress={() => router.back()}>
          <Text className="text-blue-600 font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const risk = getRiskDisplay(request.context.riskLevel);

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 pt-14 pb-4 bg-white border-b border-gray-100">
        <Pressable
          className="w-10 h-10 items-center justify-center -ml-2"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900 ml-1">
          Authorization Request
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-5 pb-40"
      >
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
            <Ionicons name="hardware-chip-outline" size={20} color="#2563EB" />
          </View>
          <View>
            <Text className="text-base font-bold text-gray-900">
              {agent?.name ?? "Unknown Agent"}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <View
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  agent?.status === "online" ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <Text className="text-xs text-gray-500 capitalize">
                {agent?.status ?? "offline"}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
          <View className="flex-row items-center justify-between mb-3">
            <View className="bg-blue-50 rounded-full px-3 py-1">
              <Text className="text-xs font-medium text-blue-700">
                {getCapabilityDisplayName(request.capability)}
              </Text>
            </View>
            <View
              className="rounded-full px-3 py-1"
              style={{ backgroundColor: risk.color + "18" }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: risk.color }}
              >
                {risk.label}
              </Text>
            </View>
          </View>

          <Text className="text-sm text-gray-500 mb-1">Action</Text>
          <Text className="text-base font-semibold text-gray-900 mb-3">
            {getActionDisplayName(request.action)}
          </Text>

          <Text className="text-sm text-gray-500 mb-1">Description</Text>
          <Text className="text-base text-gray-800">
            {request.context.description}
          </Text>
        </View>

        {request.capability === "evm-signer" && (
          <EvmDetails request={request} />
        )}
        {request.capability === "generic-approval" && (
          <GenericParams params={request.params} />
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-4 pb-10">
        <Pressable
          className="bg-green-600 rounded-xl py-4 items-center mb-3 active:bg-green-700"
          onPress={() => handleDecision("approved")}
        >
          <Text className="text-white font-bold text-base">Approve</Text>
        </Pressable>
        <Pressable
          className="border border-red-500 rounded-xl py-4 items-center active:bg-red-50"
          onPress={() => handleDecision("rejected")}
        >
          <Text className="text-red-500 font-bold text-base">Reject</Text>
        </Pressable>
      </View>
    </View>
  );
}
