import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import { sha256 } from "@noble/hashes/sha256";
import { useAuthStore } from "../stores";

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);
  const { pinHash, biometricEnabled } = useAuthStore();

  useEffect(() => {
    if (biometricEnabled) {
      attemptBiometric();
    }
  }, []);

  async function attemptBiometric() {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Open Auth",
        fallbackLabel: "Use PIN",
        disableDeviceFallback: true,
      });
      if (result.success) {
        onUnlock();
      }
    } catch {
      // Biometric failed, user can enter PIN
    }
  }

  function handlePinChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    setError("");

    if (digits.length === 6) {
      const hash = Buffer.from(sha256(new TextEncoder().encode(digits))).toString("hex");
      if (hash === pinHash) {
        onUnlock();
      } else {
        setError("Incorrect PIN");
        setPin("");
      }
    }
  }

  return (
    <View className="flex-1 bg-white items-center justify-center px-8">
      <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-6">
        <Ionicons name="lock-closed" size={32} color="#2563EB" />
      </View>
      <Text className="text-2xl font-bold mb-2">Welcome Back</Text>
      <Text className="text-gray-500 mb-8">Enter your PIN to unlock</Text>

      <TextInput
        ref={inputRef}
        value={pin}
        onChangeText={handlePinChange}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        style={{ position: "absolute", opacity: 0 }}
      />

      <Pressable
        className="flex-row gap-3 mb-4"
        onPress={() => inputRef.current?.focus()}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <View
            key={i}
            className={`w-4 h-4 rounded-full ${
              i < pin.length ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
        ))}
      </Pressable>

      {error ? (
        <Text className="text-red-500 text-sm mb-4">{error}</Text>
      ) : (
        <View className="h-5 mb-4" />
      )}

      {biometricEnabled && (
        <Pressable
          className="flex-row items-center gap-2 mt-4"
          onPress={attemptBiometric}
        >
          <Ionicons name="finger-print" size={24} color="#2563EB" />
          <Text className="text-blue-600">Use Biometrics</Text>
        </Pressable>
      )}
    </View>
  );
}
