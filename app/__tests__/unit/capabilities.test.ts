import { describe, it, expect, vi } from "vitest";
import { CapabilityRegistry } from "../../services/capabilities";
import type { CapabilityDefinition, AuthRequest } from "../../services/types";

function makeMockHandler(overrides?: Partial<CapabilityDefinition["handler"]>) {
  return {
    validate: vi.fn(() => ({ valid: true })),
    execute: vi.fn(async () => ({ token: "abc123" })),
    ...overrides,
  };
}

function makeCapability(id: string, handler = makeMockHandler()): CapabilityDefinition {
  return { id, displayName: id, actions: ["do_thing"], handler };
}

function makeRequest(overrides?: Partial<AuthRequest>): AuthRequest {
  return {
    requestId: "req-1",
    agentId: "agent-1",
    capability: "test-cap",
    action: "do_thing",
    params: { foo: "bar" },
    context: { description: "test", riskLevel: "low" },
    receivedAt: Date.now(),
    ...overrides,
  };
}

describe("CapabilityRegistry", () => {
  it("register + get: returns the registered capability", () => {
    const registry = new CapabilityRegistry();
    const cap = makeCapability("test-cap");
    registry.register(cap);
    expect(registry.get("test-cap")).toBe(cap);
  });

  it("getAll / getIds: returns all registered capabilities", () => {
    const registry = new CapabilityRegistry();
    const a = makeCapability("cap-a");
    const b = makeCapability("cap-b");
    registry.register(a);
    registry.register(b);
    expect(registry.getAll()).toEqual([a, b]);
    expect(registry.getIds()).toEqual(["cap-a", "cap-b"]);
  });

  it("route: returns UNSUPPORTED_CAPABILITY for unknown capability", async () => {
    const registry = new CapabilityRegistry();
    const res = await registry.route(makeRequest({ capability: "nope" }));
    expect(res.status).toBe("error");
    expect(res.error?.code).toBe("UNSUPPORTED_CAPABILITY");
  });

  it("route: returns INVALID_PARAMS when validation fails", async () => {
    const registry = new CapabilityRegistry();
    const handler = makeMockHandler({
      validate: vi.fn(() => ({ valid: false, error: "bad" })),
    });
    registry.register(makeCapability("test-cap", handler));
    const res = await registry.route(makeRequest());
    expect(res.status).toBe("error");
    expect(res.error?.code).toBe("INVALID_PARAMS");
    expect(res.error?.message).toBe("bad");
  });

  it("route: returns approved with result on success", async () => {
    const registry = new CapabilityRegistry();
    registry.register(makeCapability("test-cap"));
    const res = await registry.route(makeRequest());
    expect(res.status).toBe("approved");
    expect(res.result).toEqual({ token: "abc123" });
  });

  it("route: returns EXECUTION_ERROR when handler throws", async () => {
    const registry = new CapabilityRegistry();
    const handler = makeMockHandler({
      execute: vi.fn(async () => { throw new Error("boom"); }),
    });
    registry.register(makeCapability("test-cap", handler));
    const res = await registry.route(makeRequest());
    expect(res.status).toBe("error");
    expect(res.error?.code).toBe("EXECUTION_ERROR");
    expect(res.error?.message).toBe("boom");
  });

  it("route: generic-approval capability returns approved", async () => {
    const registry = new CapabilityRegistry();
    const handler = makeMockHandler({
      execute: vi.fn(async () => ({ approved: true })),
    });
    registry.register(makeCapability("generic-approval", handler));
    const res = await registry.route(makeRequest({ capability: "generic-approval" }));
    expect(res.status).toBe("approved");
    expect(res.result).toEqual({ approved: true });
  });
});
