import { useState, useEffect } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import { useAuthStore, useAgentsStore, useHistoryStore, useRequestsStore } from "../../stores";
import { DEMO_AGENTS, DEMO_HISTORY, DEMO_INITIAL_REQUEST } from "../../services/demo-data";

type BiometricInfo = {
  available: boolean;
  type: string;
  icon: string;
};

function getBiometricLabel(types: LocalAuthentication.AuthenticationType[]): BiometricInfo {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return { available: true, type: "Face ID", icon: "scan" };
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return { available: true, type: "Fingerprint", icon: "finger-print" };
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return { available: true, type: "Iris Scan", icon: "eye" };
  }
  return { available: false, type: "", icon: "finger-print" };
}

export default function SetupBiometricScreen() {
  const [biometric, setBiometric] = useState<BiometricInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const { isDemoMode, setBiometricEnabled, setOnboarded, setLocked } = useAuthStore();
  const { setAgents } = useAgentsStore();
  const { setRecords } = useHistoryStore();
  const { addRequest } = useRequestsStore();

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        setBiometric({ available: false, type: "", icon: "finger-print" });
        setLoading(false);
        return;
      }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        setBiometric({ available: false, type: "", icon: "finger-print" });
        setLoading(false);
        return;
      }
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      setBiometric(getBiometricLabel(types));
      setLoading(false);
    })();
  }, []);

  const initializeApp = () => {
    if (isDemoMode) {
      setAgents(DEMO_AGENTS);
      setRecords(DEMO_HISTORY);
      addRequest(DEMO_INITIAL_REQUEST);
    }
    setOnboarded(true);
    setLocked(false);
    router.replace("/(tabs)");
  };

  const handleEnable = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Authenticate with ${biometric?.type}`,
      fallbackLabel: "Use PIN",
      cancelLabel: "Cancel",
    });
    if (result.success) {
      setBiometricEnabled(true);
    }
    initializeApp();
  };

  const handleSkip = () => {
    initializeApp();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!biometric?.available) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-8">
            <Ionicons name="finger-print" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Biometrics Unavailable
          </Text>
          <Text className="text-base text-gray-500 text-center mb-12">
            Your device does not support biometric authentication. You can always enable it later in Settings.
          </Text>
        </View>

        <View className="px-8 pb-8">
          <Pressable
            onPress={handleSkip}
            className="bg-blue-600 rounded-2xl py-4 items-center active:bg-blue-700"
          >
            <Text className="text-white text-lg font-semibold">Continue</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-28 h-28 rounded-full bg-blue-50 items-center justify-center mb-10">
          <Ionicons name={biometric.icon} size={56} color="#2563EB" />
        </View>
        <Text className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Enable {biometric.type}?
        </Text>
        <Text className="text-base text-gray-500 text-center leading-6 px-4">
          Unlock the app quickly and securely using {biometric.type}.
          You can change this later in Settings.
        </Text>
      </View>

      <View className="px-8 pb-8 gap-3">
        <Pressable
          onPress={handleEnable}
          className="bg-blue-600 rounded-2xl py-4 items-center active:bg-blue-700"
        >
          <Text className="text-white text-lg font-semibold">Enable {biometric.type}</Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          className="rounded-2xl py-4 items-center active:bg-gray-50"
        >
          <Text className="text-gray-500 text-lg font-medium">Skip for Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
