import { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  useWindowDimensions,
  type ViewToken,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const slides = [
  {
    icon: "shield-checkmark" as const,
    title: "Authorize with Confidence",
    subtitle: "Your personal authorization hub for AI agents",
  },
  {
    icon: "lock-closed" as const,
    title: "End-to-End Encrypted",
    subtitle: "Every request is encrypted. Only you can approve.",
  },
  {
    icon: "flash" as const,
    title: "Simple & Secure",
    subtitle: "Pair your agents, review requests, approve with one tap.",
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = activeIndex === slides.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (isLast) {
      router.push("./setup-pin");
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(_, i) => String(i)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 items-center justify-center px-8">
            <View className="w-28 h-28 rounded-full bg-blue-50 items-center justify-center mb-10">
              <Ionicons name={item.icon} size={56} color="#2563EB" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 text-center mb-4">
              {item.title}
            </Text>
            <Text className="text-lg text-gray-500 text-center leading-7 px-4">
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      <View className="px-8 pb-8">
        <View className="flex-row justify-center mb-8">
          {slides.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full mx-1.5 ${
                i === activeIndex ? "w-8 bg-blue-600" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          className="bg-blue-600 rounded-2xl py-4 items-center active:bg-blue-700"
        >
          <Text className="text-white text-lg font-semibold">
            {isLast ? "Get Started" : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
