import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const TIMEOUT_SECONDS = 300;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export default function PairScreen() {
  const [code] = useState(generateCode);
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const expired = secondsLeft === 0;

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
          Pair New Agent
        </Text>
      </View>

      <View className="flex-1 items-center px-6 pt-10">
        <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center mb-6">
          <Ionicons name="link-outline" size={32} color="#2563EB" />
        </View>

        <Text className="text-base text-gray-600 text-center mb-8">
          Enter this code on your agent, or scan the QR code
        </Text>

        <View className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-2xl items-center justify-center mb-8 bg-white">
          <Ionicons name="qr-code-outline" size={48} color="#D1D5DB" />
          <Text className="text-sm text-gray-400 mt-2">QR Code</Text>
        </View>

        <View className="flex-row items-center mb-3">
          {code.split("").map((char, i) => (
            <View
              key={i}
              className="w-12 h-14 mx-1 bg-white rounded-xl border border-gray-200 items-center justify-center"
            >
              <Text className="text-2xl font-bold text-gray-900 font-mono">
                {char}
              </Text>
            </View>
          ))}
        </View>

        <Pressable
          className="flex-row items-center mb-8 py-2 px-4 rounded-lg active:bg-gray-100"
          onPress={handleCopy}
        >
          <Ionicons
            name={copied ? "checkmark-circle" : "copy-outline"}
            size={18}
            color={copied ? "#16A34A" : "#6B7280"}
          />
          <Text
            className={`ml-1.5 text-sm font-medium ${
              copied ? "text-green-600" : "text-gray-500"
            }`}
          >
            {copied ? "Copied!" : "Copy code"}
          </Text>
        </Pressable>

        <View className="items-center mb-10">
          {expired ? (
            <Text className="text-sm text-red-500 font-medium">
              Code expired
            </Text>
          ) : (
            <>
              <Text className="text-sm text-gray-400 mb-1">
                Expires in{" "}
                <Text className="font-semibold text-gray-600">
                  {minutes}:{seconds.toString().padStart(2, "0")}
                </Text>
              </Text>
              <View className="flex-row items-center mt-2">
                <View className="w-2 h-2 rounded-full bg-amber-400 mr-2" />
                <Text className="text-sm text-gray-500">
                  Waiting for agent to connect...
                </Text>
              </View>
            </>
          )}
        </View>

        <Pressable
          className="border border-gray-300 rounded-xl px-8 py-3 active:bg-gray-50"
          onPress={() => router.back()}
        >
          <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
