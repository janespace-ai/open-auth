import { describe, it, expect, vi } from "vitest";
import { ServiceContainer } from "../../services/container";
import {
  MockRelayService,
  MockE2EEEngine,
  MockKeyManager,
  MockSigningEngine,
  MockCapabilityRegistry,
  MockNotificationService,
} from "../../services/mock";
import { CapabilityRegistry } from "../../services/capabilities";

describe("ServiceContainer", () => {
  function createMockServices() {
    return {
      relay: new MockRelayService(),
      e2ee: new MockE2EEEngine(),
      keyManager: new MockKeyManager(),
      signing: new MockSigningEngine(),
      capabilities: new MockCapabilityRegistry(),
      notifications: new MockNotificationService(),
    };
  }

  it("demo mode initialization", () => {
    const mocks = createMockServices();
    ServiceContainer.initialize(mocks, true);

    expect(ServiceContainer.isDemoMode).toBe(true);
    expect(ServiceContainer.relay).toBe(mocks.relay);
    expect(ServiceContainer.e2ee).toBe(mocks.e2ee);
    expect(ServiceContainer.keyManager).toBe(mocks.keyManager);
    expect(ServiceContainer.signing).toBe(mocks.signing);
    expect(ServiceContainer.capabilities).toBe(mocks.capabilities);
    expect(ServiceContainer.notifications).toBe(mocks.notifications);
  });

  it("real mode initialization", () => {
    const mocks = createMockServices();
    ServiceContainer.initialize(mocks, false);

    expect(ServiceContainer.isDemoMode).toBe(false);
  });

  it("mode switch overrides", () => {
    const mocks = createMockServices();
    ServiceContainer.initialize(mocks, true);
    expect(ServiceContainer.isDemoMode).toBe(true);

    ServiceContainer.initialize(mocks, false);
    expect(ServiceContainer.isDemoMode).toBe(false);
  });
});

describe("CapabilityRegistry routing", () => {
  const testRequest = {
    requestId: "req-1",
    agentId: "agent-1",
    capability: "generic-approval",
    action: "approve",
    params: { operation: "test" },
    context: { description: "Test", riskLevel: "low" as const },
    receivedAt: Date.now(),
  };

  it("generic-approval route returns approved", async () => {
    const registry = new CapabilityRegistry();
    registry.register({
      id: "generic-approval",
      displayName: "Generic Approval",
      actions: ["approve"],
      handler: {
        validate: () => ({ valid: true }),
        execute: async () => ({ approved: true, token: "t1" }),
      },
    });

    const response = await registry.route(testRequest);
    expect(response.status).toBe("approved");
  });

  it("validation rejection propagates", async () => {
    const registry = new CapabilityRegistry();
    registry.register({
      id: "generic-approval",
      displayName: "Generic Approval",
      actions: ["approve"],
      handler: {
        validate: () => ({ valid: false, error: "missing field" }),
        execute: async () => ({}),
      },
    });

    const response = await registry.route(testRequest);
    expect(response.status).toBe("error");
    expect(response.error?.code).toBe("INVALID_PARAMS");
  });
});
