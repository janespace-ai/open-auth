import { create } from "zustand";
import type { Agent } from "../services/types";

interface AgentsState {
  agents: Agent[];
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  getAgent: (id: string) => Agent | undefined;
  reset: () => void;
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents: [],
  setAgents: (agents) => set({ agents }),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
  updateAgent: (id, updates) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  getAgent: (id) => get().agents.find((a) => a.id === id),
  reset: () => set({ agents: [] }),
}));
