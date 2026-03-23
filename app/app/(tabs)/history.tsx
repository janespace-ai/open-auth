import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  SectionList,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useHistoryStore } from "../../stores/history";
import {
  getActionDisplayName,
  formatTimestamp,
  groupByDate,
} from "../../utils/display";
import type { AuthResponseStatus } from "../../services/types";

type Filter = "all" | "approved" | "rejected";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function HistoryScreen() {
  const records = useHistoryStore((s) => s.records);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () =>
      filter === "all"
        ? records
        : records.filter((r) => r.status === filter),
    [records, filter],
  );

  const sections = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <View className="flex-1 bg-white">
      <View className="px-5 pt-14 pb-3">
        <Text className="text-2xl font-bold text-gray-900">History</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-5 pb-3"
        contentContainerStyle={{ gap: 8 }}
      >
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full ${
              filter === f.key ? "bg-blue-600" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                filter === f.key ? "text-white" : "text-gray-600"
              }`}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        renderSectionHeader={({ section: { title } }) => (
          <View className="pt-4 pb-2 bg-white">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <HistoryRow
            status={item.status}
            action={item.action}
            agentName={item.agentName}
            description={item.description}
            timestamp={item.timestamp}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-24">
            <Ionicons name="time-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-3 text-base">
              No history yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

function HistoryRow({
  status,
  action,
  agentName,
  description,
  timestamp,
}: {
  status: AuthResponseStatus;
  action: string;
  agentName: string;
  description: string;
  timestamp: number;
}) {
  const isApproved = status === "approved";

  return (
    <View className="flex-row items-center py-3 border-b border-gray-100">
      <View
        className={`w-9 h-9 rounded-full items-center justify-center ${
          isApproved ? "bg-green-50" : "bg-red-50"
        }`}
      >
        <Ionicons
          name={isApproved ? "checkmark-circle" : "close-circle"}
          size={22}
          color={isApproved ? "#16A34A" : "#DC2626"}
        />
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
            {getActionDisplayName(action)}
          </Text>
          <Text className="text-xs text-gray-400 ml-2">
            {formatTimestamp(timestamp)}
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mt-0.5">{agentName}</Text>
        <Text className="text-xs text-gray-400 mt-0.5" numberOfLines={1}>
          {description}
        </Text>
      </View>
    </View>
  );
}
