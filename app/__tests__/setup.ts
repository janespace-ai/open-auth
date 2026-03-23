import { vi } from "vitest";

const secureStoreMap = new Map<string, string>();

vi.mock("expo-secure-store", () => ({
  setItemAsync: vi.fn(async (key: string, value: string) => {
    secureStoreMap.set(key, value);
  }),
  getItemAsync: vi.fn(async (key: string) => {
    return secureStoreMap.get(key) ?? null;
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    secureStoreMap.delete(key);
  }),
}));

vi.mock("expo-local-authentication", () => ({
  hasHardwareAsync: vi.fn(async () => true),
  isEnrolledAsync: vi.fn(async () => true),
  supportedAuthenticationTypesAsync: vi.fn(async () => [1]),
  authenticateAsync: vi.fn(async () => ({ success: true })),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}));

vi.mock("expo-notifications", () => ({
  requestPermissionsAsync: vi.fn(async () => ({ status: "granted" })),
  getExpoPushTokenAsync: vi.fn(async () => ({ data: "mock-token" })),
  scheduleNotificationAsync: vi.fn(async () => "mock-id"),
  setNotificationHandler: vi.fn(),
  addNotificationResponseReceivedListener: vi.fn(() => ({ remove: vi.fn() })),
}));

vi.mock("expo-sqlite", () => ({
  openDatabaseAsync: vi.fn(async () => ({
    execAsync: vi.fn(async () => {}),
    closeAsync: vi.fn(async () => {}),
  })),
}));

vi.mock("expo-clipboard", () => ({
  setStringAsync: vi.fn(async () => {}),
  getStringAsync: vi.fn(async () => ""),
}));

beforeEach(() => {
  secureStoreMap.clear();
});
