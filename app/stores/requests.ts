import { create } from "zustand";
import type { AuthRequest } from "../services/types";

interface RequestsState {
  pending: AuthRequest[];
  addRequest: (request: AuthRequest) => void;
  removeRequest: (requestId: string) => void;
  getRequest: (requestId: string) => AuthRequest | undefined;
  clearAll: () => void;
}

export const useRequestsStore = create<RequestsState>((set, get) => ({
  pending: [],
  addRequest: (request) => set((s) => ({ pending: [...s.pending, request] })),
  removeRequest: (requestId) =>
    set((s) => ({
      pending: s.pending.filter((r) => r.requestId !== requestId),
    })),
  getRequest: (requestId) => get().pending.find((r) => r.requestId === requestId),
  clearAll: () => set({ pending: [] }),
}));
