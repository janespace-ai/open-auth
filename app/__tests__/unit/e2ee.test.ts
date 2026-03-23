import { describe, it, expect } from "vitest";
import { E2EEEngine } from "../../services/e2ee";

function makeSessionPair() {
  const alice = E2EEEngine.generateKeyPair();
  const bob = E2EEEngine.generateKeyPair();
  const aliceSession = E2EEEngine.createSession("test", alice.privateKey, alice.publicKey, bob.publicKey);
  const bobSession = E2EEEngine.createSession("test", bob.privateKey, bob.publicKey, alice.publicKey);
  return { alice, bob, aliceSession, bobSession };
}

function cloneSession(original: ReturnType<typeof E2EEEngine.createSession>) {
  return { ...original, sendSeq: 0, recvSeq: 0, highestRecvSeq: 0 };
}

describe("E2EEEngine", () => {
  describe("generateKeyPair", () => {
    it("produces 32-byte private and public keys", () => {
      const kp = E2EEEngine.generateKeyPair();
      expect(kp.privateKey).toBeInstanceOf(Uint8Array);
      expect(kp.publicKey).toBeInstanceOf(Uint8Array);
      expect(kp.privateKey.length).toBe(32);
      expect(kp.publicKey.length).toBe(32);
    });

    it("produces different keys on each call", () => {
      const a = E2EEEngine.generateKeyPair();
      const b = E2EEEngine.generateKeyPair();
      expect(a.privateKey).not.toEqual(b.privateKey);
      expect(a.publicKey).not.toEqual(b.publicKey);
    });
  });

  describe("computeSessionKey", () => {
    it("is symmetric: A(alicePriv, bobPub) === B(bobPriv, alicePub)", () => {
      const alice = E2EEEngine.generateKeyPair();
      const bob = E2EEEngine.generateKeyPair();
      const keyA = E2EEEngine.computeSessionKey(alice.privateKey, bob.publicKey);
      const keyB = E2EEEngine.computeSessionKey(bob.privateKey, alice.publicKey);
      expect(keyA).toEqual(keyB);
    });
  });

  describe("encrypt / decrypt", () => {
    it("round trips a single message", () => {
      const { aliceSession, bobSession } = makeSessionPair();
      const { encrypted } = E2EEEngine.encrypt(aliceSession, "hello world");
      const { plaintext } = E2EEEngine.decrypt(bobSession, encrypted);
      expect(plaintext).toBe("hello world");
    });

    it("round trips 10 consecutive messages", () => {
      const { aliceSession, bobSession } = makeSessionPair();
      for (let i = 0; i < 10; i++) {
        const msg = `message-${i}`;
        const { encrypted } = E2EEEngine.encrypt(aliceSession, msg);
        const { plaintext } = E2EEEngine.decrypt(bobSession, encrypted);
        expect(plaintext).toBe(msg);
      }
    });

    it("increments seq on each encrypt (1, 2, 3)", () => {
      const { aliceSession } = makeSessionPair();
      const r1 = E2EEEngine.encrypt(aliceSession, "a");
      const r2 = E2EEEngine.encrypt(aliceSession, "b");
      const r3 = E2EEEngine.encrypt(aliceSession, "c");
      expect(r1.seq).toBe(1);
      expect(r2.seq).toBe(2);
      expect(r3.seq).toBe(3);
    });
  });

  describe("anti-replay", () => {
    it("rejects decrypting the same payload twice", () => {
      const { aliceSession, bobSession } = makeSessionPair();
      const { encrypted } = E2EEEngine.encrypt(aliceSession, "once");
      E2EEEngine.decrypt(bobSession, encrypted);
      expect(() => E2EEEngine.decrypt(bobSession, encrypted)).toThrowError("replay");
    });

    it("rejects seq lower than highest", () => {
      const { alice, bob } = makeSessionPair();
      const sender = E2EEEngine.createSession("test", alice.privateKey, alice.publicKey, bob.publicKey);
      const receiver = E2EEEngine.createSession("test", bob.privateKey, bob.publicKey, alice.publicKey);

      const msg1 = E2EEEngine.encrypt(sender, "first");
      const msg2 = E2EEEngine.encrypt(sender, "second");

      E2EEEngine.decrypt(receiver, msg2.encrypted);
      expect(() => E2EEEngine.decrypt(receiver, msg1.encrypted)).toThrowError("replay");
    });

    it("rejects seq gap greater than 100", () => {
      const { alice, bob } = makeSessionPair();
      const sender = E2EEEngine.createSession("test", alice.privateKey, alice.publicKey, bob.publicKey);
      const decryptSession = E2EEEngine.createSession("test", bob.privateKey, bob.publicKey, alice.publicKey);

      for (let i = 0; i < 101; i++) {
        E2EEEngine.encrypt(sender, `msg-${i}`);
      }
      const far = E2EEEngine.encrypt(sender, "too far");
      expect(() => E2EEEngine.decrypt(decryptSession, far.encrypted)).toThrowError("too far ahead");
    });
  });

  describe("payload validation", () => {
    it("throws on too-short payload", () => {
      const { bobSession } = makeSessionPair();
      const shortPayload = globalThis.btoa(String.fromCharCode(...new Uint8Array(10)));
      expect(() => E2EEEngine.decrypt(bobSession, shortPayload)).toThrowError("too short");
    });
  });

  describe("envelope format", () => {
    it("first 4 bytes are big-endian seq", () => {
      const { aliceSession } = makeSessionPair();
      const { encrypted, seq } = E2EEEngine.encrypt(aliceSession, "test");
      const binary = globalThis.atob(encrypted);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const view = new DataView(bytes.buffer);
      expect(view.getUint32(0, false)).toBe(seq);
    });
  });

  describe("createSession", () => {
    it("initialises all counters to 0", () => {
      const { aliceSession } = makeSessionPair();
      expect(aliceSession.sendSeq).toBe(0);
      expect(aliceSession.recvSeq).toBe(0);
      expect(aliceSession.highestRecvSeq).toBe(0);
    });
  });
});
