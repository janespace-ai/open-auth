import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { useAuthStore } from "../../stores";

const PIN_LENGTH = 6;

export default function SetupPinScreen() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [phase, setPhase] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");
  const inputRef = useRef<TextInput>(null);

  const { setPinHash, setDemoMode } = useAuthStore();

  const activePin = phase === "enter" ? pin : confirmPin;
  const setActivePin = phase === "enter" ? setPin : setConfirmPin;

  const handlePinChange = useCallback(
    (value: string) => {
      const digits = value.replace(/\D/g, "").slice(0, PIN_LENGTH);
      setError("");
      setActivePin(digits);

      if (digits.length === PIN_LENGTH) {
        if (phase === "enter") {
          setTimeout(() => {
            setPhase("confirm");
            setConfirmPin("");
          }, 200);
        } else {
          setTimeout(() => {
            if (digits !== pin) {
              setError("PINs don't match. Try again.");
              setConfirmPin("");
              setPhase("enter");
              setPin("");
            } else {
              completeSetup(digits);
            }
          }, 200);
        }
      }
    },
    [phase, pin],
  );

  const completeSetup = (finalPin: string) => {
    if (finalPin === "000000") {
      Alert.alert(
        "Weak PIN",
        "This PIN is very simple. Are you sure?",
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              setPin("");
              setConfirmPin("");
              setPhase("enter");
            },
          },
          {
            text: "Continue",
            onPress: () => commitPin(finalPin, true),
          },
        ],
      );
    } else {
      commitPin(finalPin, false);
    }
  };

  const commitPin = (finalPin: string, demo: boolean) => {
    const hash = bytesToHex(sha256(new TextEncoder().encode(finalPin)));
    setPinHash(hash);
    if (demo) setDemoMode(true);
    router.push("./setup-biometric");
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Pressable className="flex-1" onPress={focusInput}>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-8">
            <Ionicons name="keypad" size={40} color="#2563EB" />
          </View>

          <Text className="text-3xl font-bold text-gray-900 mb-2">
            {phase === "enter" ? "Set Your PIN" : "Confirm Your PIN"}
          </Text>
          <Text className="text-base text-gray-500 text-center mb-12">
            {phase === "enter"
              ? "Choose a 6-digit PIN to secure your app"
              : "Enter the same PIN again to confirm"}
          </Text>

          <View className="flex-row gap-3 mb-6">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                className={`w-4 h-4 rounded-full ${
                  i < activePin.length ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </View>

          {error ? (
            <Text className="text-red-500 text-sm mt-2">{error}</Text>
          ) : (
            <View className="h-5 mt-2" />
          )}

          <TextInput
            ref={inputRef}
            value={activePin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={PIN_LENGTH}
            autoFocus
            caretHidden
            className="absolute opacity-0 h-0 w-0"
          />
        </View>
      </Pressable>
    </SafeAreaView>
  );
}
