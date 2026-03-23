import { create } from "zustand";

interface AuthState {
  isOnboarded: boolean;
  isLocked: boolean;
  isDemoMode: boolean;
  biometricEnabled: boolean;
  pinHash: string | null;

  setOnboarded: (value: boolean) => void;
  setLocked: (value: boolean) => void;
  setDemoMode: (value: boolean) => void;
  setBiometricEnabled: (value: boolean) => void;
  setPinHash: (hash: string) => void;
  reset: () => void;
}

const initialState = {
  isOnboarded: false,
  isLocked: true,
  isDemoMode: false,
  biometricEnabled: false,
  pinHash: null,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  setOnboarded: (value) => set({ isOnboarded: value }),
  setLocked: (value) => set({ isLocked: value }),
  setDemoMode: (value) => set({ isDemoMode: value }),
  setBiometricEnabled: (value) => set({ biometricEnabled: value }),
  setPinHash: (hash) => set({ pinHash: hash }),
  reset: () => set(initialState),
}));
