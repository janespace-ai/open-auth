import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../../stores/auth";
import { useAgentsStore } from "../../stores/agents";
import { useRequestsStore } from "../../stores/requests";
import { useHistoryStore } from "../../stores/history";
import type { Agent, AuthRequest, HistoryRecord } from "../../services/types";

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: "a1",
    name: "Test Agent",
    deviceType: "agent",
    capabilities: ["generic-approval"],
    commPubKey: "abc",
    pairedAt: Date.now(),
    lastSeen: Date.now(),
    status: "online" as const,
    ...overrides,
  };
}

function makeRequest(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    requestId: "r1",
    agentId: "a1",
    capability: "generic-approval",
    action: "approve",
    params: {},
    context: { description: "Test", riskLevel: "low" },
    receivedAt: Date.now(),
    ...overrides,
  };
}

function makeHistory(overrides: Partial<HistoryRecord> = {}): HistoryRecord {
  return {
    id: "h1",
    requestId: "r1",
    agentId: "a1",
    agentName: "Test Agent",
    capability: "generic-approval",
    action: "approve",
    description: "Test action",
    status: "approved",
    timestamp: Date.now(),
    ...overrides,
  };
}

beforeEach(() => {
  useAuthStore.getState().reset();
  useAgentsStore.getState().reset();
  useRequestsStore.getState().clearAll();
  useHistoryStore.getState().reset();
});

describe("useAuthStore", () => {
  it("has correct initial state", () => {
    const s = useAuthStore.getState();
    expect(s.isOnboarded).toBe(false);
    expect(s.isLocked).toBe(true);
    expect(s.isDemoMode).toBe(false);
    expect(s.biometricEnabled).toBe(false);
    expect(s.pinHash).toBeNull();
  });

  it("setOnboarded updates isOnboarded", () => {
    useAuthStore.getState().setOnboarded(true);
    expect(useAuthStore.getState().isOnboarded).toBe(true);
  });

  it("setLocked updates isLocked", () => {
    useAuthStore.getState().setLocked(false);
    expect(useAuthStore.getState().isLocked).toBe(false);
  });

  it("setDemoMode updates isDemoMode", () => {
    useAuthStore.getState().setDemoMode(true);
    expect(useAuthStore.getState().isDemoMode).toBe(true);
  });

  it("setPinHash updates pinHash", () => {
    useAuthStore.getState().setPinHash("abc");
    expect(useAuthStore.getState().pinHash).toBe("abc");
  });

  it("setBiometricEnabled updates biometricEnabled", () => {
    useAuthStore.getState().setBiometricEnabled(true);
    expect(useAuthStore.getState().biometricEnabled).toBe(true);
  });

  it("reset restores initial state", () => {
    const store = useAuthStore.getState();
    store.setOnboarded(true);
    store.setLocked(false);
    store.setDemoMode(true);
    store.setPinHash("xyz");
    store.setBiometricEnabled(true);

    useAuthStore.getState().reset();
    const s = useAuthStore.getState();
    expect(s.isOnboarded).toBe(false);
    expect(s.isLocked).toBe(true);
    expect(s.isDemoMode).toBe(false);
    expect(s.biometricEnabled).toBe(false);
    expect(s.pinHash).toBeNull();
  });
});

describe("useAgentsStore", () => {
  it("starts with empty agents", () => {
    expect(useAgentsStore.getState().agents).toEqual([]);
  });

  it("addAgent adds one agent", () => {
    useAgentsStore.getState().addAgent(makeAgent());
    expect(useAgentsStore.getState().agents).toHaveLength(1);
  });

  it("addAgent twice adds two agents", () => {
    useAgentsStore.getState().addAgent(makeAgent({ id: "a1" }));
    useAgentsStore.getState().addAgent(makeAgent({ id: "a2" }));
    expect(useAgentsStore.getState().agents).toHaveLength(2);
  });

  it("removeAgent removes the matching agent", () => {
    useAgentsStore.getState().addAgent(makeAgent({ id: "a1" }));
    useAgentsStore.getState().addAgent(makeAgent({ id: "a2" }));
    useAgentsStore.getState().removeAgent("a1");
    const agents = useAgentsStore.getState().agents;
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe("a2");
  });

  it("updateAgent updates a field", () => {
    useAgentsStore.getState().addAgent(makeAgent({ id: "a1", name: "Old" }));
    useAgentsStore.getState().updateAgent("a1", { name: "New" });
    expect(useAgentsStore.getState().agents[0].name).toBe("New");
  });

  it("getAgent returns the correct agent", () => {
    useAgentsStore.getState().addAgent(makeAgent({ id: "a1" }));
    useAgentsStore.getState().addAgent(makeAgent({ id: "a2", name: "Second" }));
    expect(useAgentsStore.getState().getAgent("a2")?.name).toBe("Second");
  });

  it("getAgent returns undefined for unknown id", () => {
    expect(useAgentsStore.getState().getAgent("nope")).toBeUndefined();
  });

  it("reset empties agents", () => {
    useAgentsStore.getState().addAgent(makeAgent());
    useAgentsStore.getState().reset();
    expect(useAgentsStore.getState().agents).toEqual([]);
  });
});

describe("useRequestsStore", () => {
  it("starts with empty pending", () => {
    expect(useRequestsStore.getState().pending).toEqual([]);
  });

  it("addRequest adds one request", () => {
    useRequestsStore.getState().addRequest(makeRequest());
    expect(useRequestsStore.getState().pending).toHaveLength(1);
  });

  it("removeRequest removes the matching request", () => {
    useRequestsStore.getState().addRequest(makeRequest({ requestId: "r1" }));
    useRequestsStore.getState().addRequest(makeRequest({ requestId: "r2" }));
    useRequestsStore.getState().removeRequest("r1");
    const pending = useRequestsStore.getState().pending;
    expect(pending).toHaveLength(1);
    expect(pending[0].requestId).toBe("r2");
  });

  it("getRequest returns the correct request", () => {
    useRequestsStore.getState().addRequest(makeRequest({ requestId: "r1" }));
    useRequestsStore.getState().addRequest(makeRequest({ requestId: "r2" }));
    expect(useRequestsStore.getState().getRequest("r2")?.requestId).toBe("r2");
  });

  it("getRequest returns undefined for unknown id", () => {
    expect(useRequestsStore.getState().getRequest("nope")).toBeUndefined();
  });

  it("clearAll empties pending", () => {
    useRequestsStore.getState().addRequest(makeRequest());
    useRequestsStore.getState().clearAll();
    expect(useRequestsStore.getState().pending).toEqual([]);
  });
});

describe("useHistoryStore", () => {
  it("starts with empty records", () => {
    expect(useHistoryStore.getState().records).toEqual([]);
  });

  it("addRecord prepends the record", () => {
    useHistoryStore.getState().addRecord(makeHistory({ id: "h1" }));
    useHistoryStore.getState().addRecord(makeHistory({ id: "h2" }));
    const records = useHistoryStore.getState().records;
    expect(records).toHaveLength(2);
    expect(records[0].id).toBe("h2");
    expect(records[1].id).toBe("h1");
  });

  it("setRecords replaces all records", () => {
    useHistoryStore.getState().addRecord(makeHistory({ id: "h1" }));
    const replacement = [makeHistory({ id: "h9" })];
    useHistoryStore.getState().setRecords(replacement);
    const records = useHistoryStore.getState().records;
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe("h9");
  });

  it("getByAgent filters by agentId", () => {
    useHistoryStore.getState().addRecord(makeHistory({ id: "h1", agentId: "a1" }));
    useHistoryStore.getState().addRecord(makeHistory({ id: "h2", agentId: "a2" }));
    useHistoryStore.getState().addRecord(makeHistory({ id: "h3", agentId: "a1" }));
    const filtered = useHistoryStore.getState().getByAgent("a1");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => r.agentId === "a1")).toBe(true);
  });

  it("reset empties records", () => {
    useHistoryStore.getState().addRecord(makeHistory());
    useHistoryStore.getState().reset();
    expect(useHistoryStore.getState().records).toEqual([]);
  });
});
