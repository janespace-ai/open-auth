import { ISigningEngine, IKeyManager } from "./interfaces";
import { privateKeyToAccount } from "viem/accounts";
import { type Hex } from "viem";

export class SigningEngine implements ISigningEngine {
  constructor(private keyManager: IKeyManager) {}

  async signTransaction(params: Record<string, unknown>, pin: string): Promise<Record<string, unknown>> {
    let privateKey: Uint8Array | null = null;
    try {
      privateKey = await this.keyManager.getPrivateKey(pin);
      const hex = `0x${Buffer.from(privateKey).toString("hex")}` as Hex;
      const account = privateKeyToAccount(hex);
      const serialized = await account.signTransaction(params as any);
      return { signature: serialized, address: account.address };
    } finally {
      if (privateKey) this.keyManager.zeroKey(privateKey);
    }
  }

  async signMessage(message: string, pin: string): Promise<Record<string, unknown>> {
    let privateKey: Uint8Array | null = null;
    try {
      privateKey = await this.keyManager.getPrivateKey(pin);
      const hex = `0x${Buffer.from(privateKey).toString("hex")}` as Hex;
      const account = privateKeyToAccount(hex);
      const signature = await account.signMessage({ message });
      return { signature, address: account.address };
    } finally {
      if (privateKey) this.keyManager.zeroKey(privateKey);
    }
  }

  async signTypedData(typedData: Record<string, unknown>, pin: string): Promise<Record<string, unknown>> {
    let privateKey: Uint8Array | null = null;
    try {
      privateKey = await this.keyManager.getPrivateKey(pin);
      const hex = `0x${Buffer.from(privateKey).toString("hex")}` as Hex;
      const account = privateKeyToAccount(hex);
      const signature = await account.signTypedData(typedData as any);
      return { signature, address: account.address };
    } finally {
      if (privateKey) this.keyManager.zeroKey(privateKey);
    }
  }
}
