import { describe, it, expect, beforeEach } from "vitest";
import {
  MockRelayService,
  MockKeyManager,
  MockSigningEngine,
  MockCapabilityRegistry,
  MockE2EEEngine,
  MockNotificationService,
} from "../../services/mock";
import type { AuthRequest, E2EESession } from "../../services/types";

(globalThis as Record<string, unknown>).__DEV__ = false;

describe("MockRelayService", () => {
  let relay: MockRelayService;

  beforeEach(() => {
    relay = new MockRelayService();
  });

  it("starts disconnected", () => {
    expect(relay.getStatus()).toBe("disconnected");
  });

  it("connect sets status to connected", async () => {
    await relay.connect("pair-1");
    expect(relay.getStatus()).toBe("connected");
  });

  it("disconnect sets status to disconnected", async () => {
    await relay.connect("pair-1");
    relay.disconnect();
    expect(relay.getStatus()).toBe("disconnected");
  });

  it("onMessage returns an unsubscribe function", () => {
    const unsub = relay.onMessage(() => {});
    expect(typeof unsub).toBe("function");
  });

  it("onStatusChange returns an unsubscribe function", () => {
    const unsub = relay.onStatusChange(() => {});
    expect(typeof unsub).toBe("function");
  });

  it("onStatusChange callback fires on connect", async () => {
    const statuses: string[] = [];
    relay.onStatusChange((s) => statuses.push(s));
    await relay.connect("pair-1");
    expect(statuses).toContain("connected");
  });
});

describe("MockKeyManager", () => {
  let km: MockKeyManager;

  beforeEach(() => {
    km = new MockKeyManager();
  });

  it("hasWallet returns true", async () => {
    expect(await km.hasWallet()).toBe(true);
  });

  it("getAddress returns a string starting with 0x", async () => {
    const addr = await km.getAddress();
    expect(addr).toBeTruthy();
    expect(addr!.startsWith("0x")).toBe(true);
  });

  it("generateMnemonic returns 12 words", () => {
    const words = km.generateMnemonic().split(" ");
    expect(words).toHaveLength(12);
  });

  it("validateMnemonic returns true", () => {
    expect(km.validateMnemonic("anything")).toBe(true);
  });

  it("zeroKey fills array with zeros", () => {
    const key = new Uint8Array([1, 2, 3, 4]);
    km.zeroKey(key);
    expect(key.every((b) => b === 0)).toBe(true);
  });

  it("generateWallet returns mnemonic and address", async () => {
    const result = await km.generateWallet("1234");
    expect(result.mnemonic).toBeTruthy();
    expect(result.address.startsWith("0x")).toBe(true);
  });

  it("generateCommKeyPair returns key pair", async () => {
    const pair = await km.generateCommKeyPair();
    expect(pair.privateKey).toBeInstanceOf(Uint8Array);
    expect(pair.publicKey).toBeInstanceOf(Uint8Array);
  });
});

describe("MockSigningEngine", () => {
  let engine: MockSigningEngine;

  beforeEach(() => {
    engine = new MockSigningEngine();
  });

  it("signTransaction returns signature and address", async () => {
    const result = await engine.signTransaction({ to: "0x1" }, "pin");
    expect(result).toHaveProperty("signature");
    expect(result).toHaveProperty("address");
  });

  it("signMessage returns signature and address", async () => {
    const result = await engine.signMessage("hello", "pin");
    expect(result).toHaveProperty("signature");
    expect(result).toHaveProperty("address");
  });

  it("signTypedData returns signature and address", async () => {
    const result = await engine.signTypedData({ domain: {} }, "pin");
    expect(result).toHaveProperty("signature");
    expect(result).toHaveProperty("address");
  });
});

describe("MockCapabilityRegistry", () => {
  let registry: MockCapabilityRegistry;

  beforeEach(() => {
    registry = new MockCapabilityRegistry();
  });

  it("getIds returns array with items", () => {
    const ids = registry.getIds();
    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toContain("generic-approval");
    expect(ids).toContain("evm-signer");
  });

  it("route returns an approved response", async () => {
    const request: AuthRequest = {
      requestId: "r1",
      agentId: "a1",
      capability: "generic-approval",
      action: "approve",
      params: {},
      context: { description: "Test", riskLevel: "low" },
      receivedAt: Date.now(),
    };
    const response = await registry.route(request);
    expect(response.status).toBe("approved");
    expect(response.requestId).toBe("r1");
  });

  it("get returns a capability by id", () => {
    const cap = registry.get("generic-approval");
    expect(cap).toBeDefined();
    expect(cap!.displayName).toBe("Generic Approval");
  });

  it("getAll returns all capabilities", () => {
    const all = registry.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });
});

describe("MockE2EEEngine", () => {
  let e2ee: MockE2EEEngine;

  beforeEach(() => {
    e2ee = new MockE2EEEngine();
  });

  it("generateKeyPair returns privateKey and publicKey as Uint8Array", () => {
    const pair = e2ee.generateKeyPair();
    expect(pair.privateKey).toBeInstanceOf(Uint8Array);
    expect(pair.publicKey).toBeInstanceOf(Uint8Array);
    expect(pair.privateKey.length).toBe(32);
    expect(pair.publicKey.length).toBe(32);
  });

  it("encrypt then decrypt round-trips", () => {
    const session: E2EESession = {
      pairId: "test",
      localPrivateKey: new Uint8Array(32),
      localPublicKey: new Uint8Array(32),
      remotePublicKey: new Uint8Array(32),
      sessionKey: new Uint8Array(32),
      sendSeq: 0,
      recvSeq: 0,
      highestRecvSeq: 0,
    };

    const original = "hello world";
    const { encrypted } = e2ee.encrypt(session, original);
    const { plaintext } = e2ee.decrypt(session, encrypted);
    expect(plaintext).toBe(original);
  });

  it("createSession returns a valid session", () => {
    const session = e2ee.createSession(
      "pair-1",
      new Uint8Array(32),
      new Uint8Array(32),
      new Uint8Array(32),
    );
    expect(session.pairId).toBe("pair-1");
    expect(session.sendSeq).toBe(0);
    expect(session.recvSeq).toBe(0);
  });
});

describe("MockNotificationService", () => {
  let notif: MockNotificationService;

  beforeEach(() => {
    notif = new MockNotificationService();
  });

  it("registerPushToken does not throw", async () => {
    await expect(notif.registerPushToken("pair-1")).resolves.toBeUndefined();
  });

  it("showLocalNotification does not throw", async () => {
    await expect(
      notif.showLocalNotification("Title", "Body"),
    ).resolves.toBeUndefined();
  });

  it("onNotificationTap returns a function", () => {
    const unsub = notif.onNotificationTap(() => {});
    expect(typeof unsub).toBe("function");
  });
});
