import { describe, it, expect } from "vitest";
import { E2EEEngine } from "../../services/e2ee";

describe("E2EE duplex communication", () => {
  function createDuplexPair() {
    const alice = E2EEEngine.generateKeyPair();
    const bob = E2EEEngine.generateKeyPair();
    const aliceSession = E2EEEngine.createSession("pair1", alice.privateKey, alice.publicKey, bob.publicKey);
    const bobSession = E2EEEngine.createSession("pair1", bob.privateKey, bob.publicKey, alice.publicKey);
    return { alice, bob, aliceSession, bobSession };
  }

  it("both parties derive identical session keys", () => {
    const { aliceSession, bobSession } = createDuplexPair();
    const aliceHex = Buffer.from(aliceSession.sessionKey).toString("hex");
    const bobHex = Buffer.from(bobSession.sessionKey).toString("hex");
    expect(aliceHex).toBe(bobHex);
  });

  it("Alice-to-Bob message delivery", () => {
    const { aliceSession, bobSession } = createDuplexPair();
    const { encrypted } = E2EEEngine.encrypt(aliceSession, "hello from alice");
    const { plaintext } = E2EEEngine.decrypt(bobSession, encrypted);
    expect(plaintext).toBe("hello from alice");
  });

  it("Bob-to-Alice message delivery", () => {
    const { aliceSession, bobSession } = createDuplexPair();
    const { encrypted } = E2EEEngine.encrypt(bobSession, "hello from bob");
    const { plaintext } = E2EEEngine.decrypt(aliceSession, encrypted);
    expect(plaintext).toBe("hello from bob");
  });

  it("multi-message bidirectional exchange", () => {
    const { aliceSession, bobSession } = createDuplexPair();

    for (let i = 0; i < 10; i++) {
      const isAliceSender = i % 2 === 0;
      const sender = isAliceSender ? aliceSession : bobSession;
      const receiver = isAliceSender ? bobSession : aliceSession;
      const msg = `msg-${i}-from-${isAliceSender ? "alice" : "bob"}`;

      const { encrypted } = E2EEEngine.encrypt(sender, msg);
      const { plaintext } = E2EEEngine.decrypt(receiver, encrypted);
      expect(plaintext).toBe(msg);
    }
  });

  it("cross-session isolation", () => {
    const { aliceSession } = createDuplexPair();
    const carol = E2EEEngine.generateKeyPair();
    const carolSession = E2EEEngine.createSession("pair2", carol.privateKey, carol.publicKey, carol.publicKey);

    const { encrypted } = E2EEEngine.encrypt(aliceSession, "secret for bob");
    expect(() => E2EEEngine.decrypt(carolSession, encrypted)).toThrow();
  });
});
