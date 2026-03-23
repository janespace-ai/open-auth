import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { HDKey } from '@scure/bip32';
import { scrypt } from '@noble/hashes/scrypt';
import { keccak_256 } from '@noble/hashes/sha3';
import { gcm } from '@noble/ciphers/aes';
import { secp256k1 } from '@noble/curves/secp256k1';
import { x25519 } from '@noble/curves/ed25519.js';
import { randomBytes } from '@noble/ciphers/webcrypto';
import * as SecureStore from 'expo-secure-store';

import type { IKeyManager } from './interfaces';

const DERIVATION_PATH = "m/44'/60'/0'/0/0";

const STORE_PIN_HASH = 'pin_hash';
const STORE_WALLET_KEYSTORE = 'wallet_keystore';
const STORE_WALLET_ADDRESS = 'wallet_address';
const STORE_COMM_PREFIX = 'comm_kp_';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_DKLEN = 32;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function deriveScryptKey(pin: string, salt: Uint8Array): Uint8Array {
  return scrypt(new TextEncoder().encode(pin), salt, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    dkLen: SCRYPT_DKLEN,
  });
}

function encryptPrivateKey(
  privateKey: Uint8Array,
  pin: string,
): { ciphertext: string; iv: string; salt: string } {
  const salt = randomBytes(32);
  const key = deriveScryptKey(pin, salt);
  const iv = randomBytes(12);
  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(privateKey);
  return {
    ciphertext: toHex(ciphertext),
    iv: toHex(iv),
    salt: toHex(salt),
  };
}

function decryptPrivateKey(
  store: { ciphertext: string; iv: string; salt: string },
  pin: string,
): Uint8Array {
  const salt = fromHex(store.salt);
  const iv = fromHex(store.iv);
  const ciphertext = fromHex(store.ciphertext);
  const key = deriveScryptKey(pin, salt);
  const cipher = gcm(key, iv);
  return cipher.decrypt(ciphertext);
}

function derivePrivateKeyFromMnemonic(mnemonic: string): Uint8Array {
  const seed = mnemonicToSeedSync(mnemonic);
  const hdKey = HDKey.fromMasterSeed(seed);
  const child = hdKey.derive(DERIVATION_PATH);
  if (!child.privateKey) {
    throw new Error('Failed to derive private key');
  }
  return child.privateKey;
}

function computeAddress(privateKey: Uint8Array): string {
  const pubUncompressed = secp256k1.getPublicKey(privateKey, false);
  const pubBytes = pubUncompressed.slice(1);
  const hash = keccak_256(pubBytes);
  const addressBytes = hash.slice(hash.length - 20);
  return '0x' + toHex(addressBytes);
}

function hashPin(pin: string, salt: Uint8Array): string {
  const derived = deriveScryptKey(pin, salt);
  return toHex(salt) + ':' + toHex(derived);
}

async function storeWallet(
  privateKey: Uint8Array,
  pin: string,
): Promise<void> {
  const address = computeAddress(privateKey);
  const keystore = encryptPrivateKey(privateKey, pin);
  const pinSalt = randomBytes(32);
  const pinHash = hashPin(pin, pinSalt);

  await SecureStore.setItemAsync(STORE_WALLET_KEYSTORE, JSON.stringify(keystore));
  await SecureStore.setItemAsync(STORE_PIN_HASH, pinHash);
  await SecureStore.setItemAsync(STORE_WALLET_ADDRESS, address);
}

export class KeyManager implements IKeyManager {
  generateMnemonic(): string {
    return generateMnemonic(wordlist, 128);
  }

  validateMnemonic(mnemonic: string): boolean {
    return validateMnemonic(mnemonic, wordlist);
  }

  async importMnemonic(mnemonic: string, pin: string): Promise<void> {
    if (!this.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic');
    }

    const privateKey = derivePrivateKeyFromMnemonic(mnemonic);
    try {
      await storeWallet(privateKey, pin);
    } finally {
      this.zeroKey(privateKey);
    }
  }

  async generateWallet(
    pin: string,
  ): Promise<{ mnemonic: string; address: string }> {
    const mnemonic = this.generateMnemonic();
    const privateKey = derivePrivateKeyFromMnemonic(mnemonic);
    try {
      const address = computeAddress(privateKey);
      await storeWallet(privateKey, pin);
      return { mnemonic, address };
    } finally {
      this.zeroKey(privateKey);
    }
  }

  async getAddress(): Promise<string | null> {
    const address = await SecureStore.getItemAsync(STORE_WALLET_ADDRESS);
    return address;
  }

  async getPrivateKey(pin: string): Promise<Uint8Array> {
    const pinHashStored = await SecureStore.getItemAsync(STORE_PIN_HASH);
    if (!pinHashStored) {
      throw new Error('No wallet found');
    }

    const [saltHex] = pinHashStored.split(':');
    const salt = fromHex(saltHex);
    const computed = hashPin(pin, salt);
    if (computed !== pinHashStored) {
      throw new Error('Invalid PIN');
    }

    const keystoreJson = await SecureStore.getItemAsync(STORE_WALLET_KEYSTORE);
    if (!keystoreJson) {
      throw new Error('Keystore not found');
    }

    const keystore = JSON.parse(keystoreJson);
    return decryptPrivateKey(keystore, pin);
  }

  async generateCommKeyPair(): Promise<{
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  }> {
    const privateKey = new Uint8Array(32);
    globalThis.crypto.getRandomValues(privateKey);
    const publicKey = x25519.getPublicKey(privateKey);
    return { privateKey, publicKey };
  }

  async getCommKeyPair(
    pairId: string,
  ): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array } | null> {
    const stored = await SecureStore.getItemAsync(STORE_COMM_PREFIX + pairId);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      privateKey: fromHex(parsed.privateKey),
      publicKey: fromHex(parsed.publicKey),
    };
  }

  async storeCommKeyPair(
    pairId: string,
    privateKey: Uint8Array,
    publicKey: Uint8Array,
  ): Promise<void> {
    const data = JSON.stringify({
      privateKey: toHex(privateKey),
      publicKey: toHex(publicKey),
    });
    await SecureStore.setItemAsync(STORE_COMM_PREFIX + pairId, data);
  }

  async hasWallet(): Promise<boolean> {
    const keystore = await SecureStore.getItemAsync(STORE_WALLET_KEYSTORE);
    return keystore !== null;
  }

  zeroKey(key: Uint8Array): void {
    key.fill(0);
  }
}
