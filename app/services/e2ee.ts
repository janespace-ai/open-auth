import { x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { gcm } from "@noble/ciphers/aes.js";
import { utf8ToBytes, concatBytes } from "@noble/ciphers/utils.js";

import type { IE2EEEngine } from "./interfaces";
import type { E2EESession } from "./types";

const HKDF_INFO = utf8ToBytes("open-auth-e2ee-v1");
const SESSION_KEY_LENGTH = 32;
const NONCE_LENGTH = 12;
const SEQ_OFFSET = 4;
const SEQ_HEADER_LENGTH = 4;
const AUTH_TAG_LENGTH = 16;

// Anti-replay: reject if seq is more than this many ahead of highestRecvSeq
const MAX_SEQ_WINDOW = 100;

function zeroBytes(arr: Uint8Array): void {
  arr.fill(0);
}

function seqToNonce(seq: number): Uint8Array {
  const nonce = new Uint8Array(NONCE_LENGTH);
  const view = new DataView(nonce.buffer, nonce.byteOffset, nonce.byteLength);
  view.setUint32(SEQ_OFFSET, seq, false);
  return nonce;
}

function seqToBytes(seq: number): Uint8Array {
  const buf = new Uint8Array(SEQ_HEADER_LENGTH);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  view.setUint32(0, seq, false);
  return buf;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = globalThis.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export const E2EEEngine: IE2EEEngine = {
  generateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
    const privateKey = new Uint8Array(32);
    globalThis.crypto.getRandomValues(privateKey);
    const publicKey = x25519.getPublicKey(privateKey);
    return { privateKey, publicKey };
  },

  computeSessionKey(
    localPrivateKey: Uint8Array,
    remotePublicKey: Uint8Array,
  ): Uint8Array {
    const sharedSecret = x25519.getSharedSecret(localPrivateKey, remotePublicKey);
    const sessionKey = hkdf(sha256, sharedSecret, undefined, HKDF_INFO, SESSION_KEY_LENGTH);
    zeroBytes(sharedSecret);
    return sessionKey;
  },

  encrypt(
    session: E2EESession,
    plaintext: string,
  ): { encrypted: string; seq: number } {
    const seq = ++session.sendSeq;
    const nonce = seqToNonce(seq);
    const plaintextBytes = utf8ToBytes(plaintext);

    const cipher = gcm(session.sessionKey, nonce);
    const ciphertext = cipher.encrypt(plaintextBytes);

    // Envelope: [4-byte seq BE][ciphertext + 16-byte auth tag]
    const envelope = concatBytes(seqToBytes(seq), ciphertext);
    const encrypted = bytesToBase64(envelope);

    zeroBytes(nonce);
    zeroBytes(plaintextBytes);

    return { encrypted, seq };
  },

  decrypt(
    session: E2EESession,
    payload: string,
  ): { plaintext: string; seq: number } {
    const envelope = base64ToBytes(payload);

    if (envelope.length < SEQ_HEADER_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error("E2EE: payload too short");
    }

    const view = new DataView(envelope.buffer, envelope.byteOffset, envelope.byteLength);
    const seq = view.getUint32(0, false);

    if (seq <= session.highestRecvSeq) {
      throw new Error("E2EE: replay detected (seq <= highestRecvSeq)");
    }
    if (seq > session.highestRecvSeq + MAX_SEQ_WINDOW) {
      throw new Error("E2EE: seq too far ahead");
    }

    const ciphertext = envelope.slice(SEQ_HEADER_LENGTH);
    const nonce = seqToNonce(seq);

    const cipher = gcm(session.sessionKey, nonce);
    const plaintextBytes = cipher.decrypt(ciphertext);

    session.highestRecvSeq = seq;
    session.recvSeq = seq;

    const plaintext = new TextDecoder().decode(plaintextBytes);

    zeroBytes(nonce);
    zeroBytes(plaintextBytes);

    return { plaintext, seq };
  },

  createSession(
    pairId: string,
    localPrivateKey: Uint8Array,
    localPublicKey: Uint8Array,
    remotePublicKey: Uint8Array,
  ): E2EESession {
    const sessionKey = this.computeSessionKey(localPrivateKey, remotePublicKey);
    return {
      pairId,
      localPrivateKey,
      localPublicKey,
      remotePublicKey,
      sessionKey,
      sendSeq: 0,
      recvSeq: 0,
      highestRecvSeq: 0,
    };
  },
};
