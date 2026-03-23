import { create } from "zustand";
import type { HistoryRecord } from "../services/types";

interface HistoryState {
  records: HistoryRecord[];
  setRecords: (records: HistoryRecord[]) => void;
  addRecord: (record: HistoryRecord) => void;
  getByAgent: (agentId: string) => HistoryRecord[];
  reset: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  records: [],
  setRecords: (records) => set({ records }),
  addRecord: (record) => set((s) => ({ records: [record, ...s.records] })),
  getByAgent: (agentId) => get().records.filter((r) => r.agentId === agentId),
  reset: () => set({ records: [] }),
}));
