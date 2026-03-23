import type {
  IRelayService,
  IE2EEEngine,
  IKeyManager,
  ISigningEngine,
  ICapabilityRegistry,
  INotificationService,
} from "./interfaces";
import type {
  AuthRequest,
  AuthResponse,
  CapabilityDefinition,
  ConnectionStatus,
  E2EESession,
} from "./types";

const MOCK_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
const MOCK_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

function fixedBytes(length: number, fill: number): Uint8Array {
  return new Uint8Array(length).fill(fill);
}

export class MockRelayService implements IRelayService {
  private status: ConnectionStatus = "disconnected";
  private messageHandlers = new Set<(message: string) => void>();
  private statusHandlers = new Set<(status: ConnectionStatus) => void>();

  async connect(_pairId: string): Promise<void> {
    this.setStatus("connected");
  }

  disconnect(): void {
    this.setStatus("disconnected");
  }

  send(message: string): void {
    if (__DEV__) console.log("[MockRelay] send:", message);
  }

  onMessage(handler: (message: string) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusHandlers.forEach((h) => h(status));
  }
}

export class MockE2EEEngine implements IE2EEEngine {
  generateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
    return {
      privateKey: fixedBytes(32, 0xaa),
      publicKey: fixedBytes(32, 0xbb),
    };
  }

  computeSessionKey(
    _localPrivateKey: Uint8Array,
    _remotePublicKey: Uint8Array,
  ): Uint8Array {
    return fixedBytes(32, 0x00);
  }

  encrypt(
    session: E2EESession,
    plaintext: string,
  ): { encrypted: string; seq: number } {
    const seq = session.sendSeq++;
    const encoded =
      typeof btoa === "function"
        ? btoa(plaintext)
        : Buffer.from(plaintext, "utf-8").toString("base64");
    return { encrypted: encoded, seq };
  }

  decrypt(
    session: E2EESession,
    payload: string,
  ): { plaintext: string; seq: number } {
    const seq = session.recvSeq++;
    const decoded =
      typeof atob === "function"
        ? atob(payload)
        : Buffer.from(payload, "base64").toString("utf-8");
    return { plaintext: decoded, seq };
  }

  createSession(
    pairId: string,
    localPrivateKey: Uint8Array,
    localPublicKey: Uint8Array,
    remotePublicKey: Uint8Array,
  ): E2EESession {
    return {
      pairId,
      localPrivateKey,
      localPublicKey,
      remotePublicKey,
      sessionKey: fixedBytes(32, 0x00),
      sendSeq: 0,
      recvSeq: 0,
      highestRecvSeq: 0,
    };
  }
}

export class MockKeyManager implements IKeyManager {
  generateMnemonic(): string {
    return MOCK_MNEMONIC;
  }

  validateMnemonic(_mnemonic: string): boolean {
    return true;
  }

  async importMnemonic(_mnemonic: string, _pin: string): Promise<void> {}

  async generateWallet(
    _pin: string,
  ): Promise<{ mnemonic: string; address: string }> {
    return { mnemonic: MOCK_MNEMONIC, address: MOCK_ADDRESS };
  }

  async getAddress(): Promise<string | null> {
    return MOCK_ADDRESS;
  }

  async getPrivateKey(_pin: string): Promise<Uint8Array> {
    return fixedBytes(32, 0x01);
  }

  async generateCommKeyPair(): Promise<{
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  }> {
    return {
      privateKey: fixedBytes(32, 0xcc),
      publicKey: fixedBytes(32, 0xdd),
    };
  }

  async getCommKeyPair(
    _pairId: string,
  ): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array } | null> {
    return {
      privateKey: fixedBytes(32, 0xcc),
      publicKey: fixedBytes(32, 0xdd),
    };
  }

  async storeCommKeyPair(
    _pairId: string,
    _privateKey: Uint8Array,
    _publicKey: Uint8Array,
  ): Promise<void> {}

  async hasWallet(): Promise<boolean> {
    return true;
  }

  zeroKey(key: Uint8Array): void {
    key.fill(0);
  }
}

export class MockSigningEngine implements ISigningEngine {
  async signTransaction(
    _params: Record<string, unknown>,
    _pin: string,
  ): Promise<Record<string, unknown>> {
    return {
      signature: "0xmock_tx_signature_deadbeef",
      address: MOCK_ADDRESS,
    };
  }

  async signMessage(
    _message: string,
    _pin: string,
  ): Promise<Record<string, unknown>> {
    return {
      signature: "0xmock_msg_signature_deadbeef",
      address: MOCK_ADDRESS,
    };
  }

  async signTypedData(
    _typedData: Record<string, unknown>,
    _pin: string,
  ): Promise<Record<string, unknown>> {
    return {
      signature: "0xmock_typed_signature_deadbeef",
      address: MOCK_ADDRESS,
    };
  }
}

export class MockCapabilityRegistry implements ICapabilityRegistry {
  private capabilities = new Map<string, CapabilityDefinition>();

  constructor() {
    const passthrough = {
      validate: () => ({ valid: true }),
      execute: async (action: string, params: Record<string, unknown>) => ({
        action,
        ...params,
        mock: true,
      }),
    };

    this.register({
      id: "generic-approval",
      displayName: "Generic Approval",
      actions: ["approve"],
      handler: passthrough,
    });

    this.register({
      id: "evm-signer",
      displayName: "EVM Signer",
      actions: ["sign_transaction", "sign_message", "sign_typed_data"],
      handler: passthrough,
    });
  }

  register(capability: CapabilityDefinition): void {
    this.capabilities.set(capability.id, capability);
  }

  get(id: string): CapabilityDefinition | undefined {
    return this.capabilities.get(id);
  }

  getAll(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values());
  }

  getIds(): string[] {
    return Array.from(this.capabilities.keys());
  }

  async route(request: AuthRequest): Promise<AuthResponse> {
    const cap = this.capabilities.get(request.capability);
    const result = cap
      ? await cap.handler.execute(request.action, request.params)
      : { mock: true };

    return {
      requestId: request.requestId,
      status: "approved",
      result,
    };
  }
}

export class MockNotificationService implements INotificationService {
  async registerPushToken(_pairId: string): Promise<void> {}

  async showLocalNotification(title: string, body: string): Promise<void> {
    if (__DEV__) console.log("[MockNotification]", title, body);
  }

  onNotificationTap(
    _handler: (data: Record<string, unknown>) => void,
  ): () => void {
    return () => {};
  }
}
