/// <reference types="nativewind/types" />

declare module "expo-router/entry";

declare module "@expo/vector-icons" {
  import { ComponentType } from "react";
  interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  export const Ionicons: ComponentType<IconProps>;
}

declare module "@noble/hashes/sha256" {
  export function sha256(data: Uint8Array): Uint8Array;
}

declare module "@noble/hashes/sha2.js" {
  export { sha256 } from "@noble/hashes/sha256";
}

declare module "@noble/hashes/utils" {
  export function bytesToHex(bytes: Uint8Array): string;
  export function hexToBytes(hex: string): Uint8Array;
  export function utf8ToBytes(str: string): Uint8Array;
  export function concatBytes(...arrays: Uint8Array[]): Uint8Array;
}

declare module "@noble/hashes/hkdf" {
  export function hkdf(
    hash: any,
    ikm: Uint8Array,
    salt: Uint8Array | undefined,
    info: Uint8Array,
    length: number
  ): Uint8Array;
}

declare module "@noble/hashes/hkdf.js" {
  export { hkdf } from "@noble/hashes/hkdf";
}

declare module "@noble/hashes/sha3" {
  export function keccak_256(data: Uint8Array): Uint8Array;
}

declare module "@noble/hashes/scrypt" {
  export function scrypt(
    password: Uint8Array,
    salt: Uint8Array,
    opts: { N: number; r: number; p: number; dkLen: number }
  ): Uint8Array;
}

declare module "@noble/curves/ed25519" {
  export const x25519: {
    getPublicKey(privateKey: Uint8Array): Uint8Array;
    getSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Uint8Array;
    utils: {
      randomSecretKey(): Uint8Array;
    };
  };
}

declare module "@noble/curves/ed25519.js" {
  export { x25519 } from "@noble/curves/ed25519";
}

declare module "@noble/curves/secp256k1" {
  export const secp256k1: {
    getPublicKey(privateKey: Uint8Array, compressed?: boolean): Uint8Array;
    utils: {
      randomPrivateKey(): Uint8Array;
    };
  };
}

declare module "@noble/ciphers/aes" {
  interface AESGCMCipher {
    encrypt(plaintext: Uint8Array): Uint8Array;
    decrypt(ciphertext: Uint8Array): Uint8Array;
  }
  export function gcm(key: Uint8Array, nonce: Uint8Array): AESGCMCipher;
}

declare module "@noble/ciphers/aes.js" {
  export { gcm } from "@noble/ciphers/aes";
}

declare module "@noble/ciphers/utils.js" {
  export function utf8ToBytes(str: string): Uint8Array;
  export function concatBytes(...arrays: Uint8Array[]): Uint8Array;
}

declare module "@noble/ciphers/webcrypto" {
  export function randomBytes(length: number): Uint8Array;
}

declare module "@scure/bip39" {
  export function generateMnemonic(wordlist: string[], strength?: number): string;
  export function validateMnemonic(mnemonic: string, wordlist: string[]): boolean;
  export function mnemonicToSeedSync(mnemonic: string, passphrase?: string): Uint8Array;
}

declare module "@scure/bip39/wordlists/english" {
  export const wordlist: string[];
}

declare module "@scure/bip32" {
  interface HDKey {
    derive(path: string): HDKey;
    privateKey: Uint8Array | null;
    publicKey: Uint8Array;
  }
  export const HDKey: {
    fromMasterSeed(seed: Uint8Array): HDKey;
  };
}

declare module "expo-clipboard" {
  export function setStringAsync(text: string): Promise<void>;
  export function getStringAsync(): Promise<string>;
}
