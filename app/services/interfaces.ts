import type {
  Agent,
  AuthRequest,
  AuthResponse,
  E2EESession,
  ConnectionStatus,
  CapabilityDefinition,
} from "./types";

export interface IRelayService {
  connect(pairId: string): Promise<void>;
  disconnect(): void;
  send(message: string): void;
  onMessage(handler: (message: string) => void): () => void;
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void;
  getStatus(): ConnectionStatus;
}

export interface IE2EEEngine {
  generateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array };
  computeSessionKey(
    localPrivateKey: Uint8Array,
    remotePublicKey: Uint8Array,
  ): Uint8Array;
  encrypt(
    session: E2EESession,
    plaintext: string,
  ): { encrypted: string; seq: number };
  decrypt(
    session: E2EESession,
    payload: string,
  ): { plaintext: string; seq: number };
  createSession(
    pairId: string,
    localPrivateKey: Uint8Array,
    localPublicKey: Uint8Array,
    remotePublicKey: Uint8Array,
  ): E2EESession;
}

export interface IKeyManager {
  generateMnemonic(): string;
  validateMnemonic(mnemonic: string): boolean;
  importMnemonic(mnemonic: string, pin: string): Promise<void>;
  generateWallet(
    pin: string,
  ): Promise<{ mnemonic: string; address: string }>;
  getAddress(): Promise<string | null>;
  getPrivateKey(pin: string): Promise<Uint8Array>;
  generateCommKeyPair(): Promise<{
    privateKey: Uint8Array;
    publicKey: Uint8Array;
  }>;
  getCommKeyPair(
    pairId: string,
  ): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array } | null>;
  storeCommKeyPair(
    pairId: string,
    privateKey: Uint8Array,
    publicKey: Uint8Array,
  ): Promise<void>;
  hasWallet(): Promise<boolean>;
  zeroKey(key: Uint8Array): void;
}

export interface ISigningEngine {
  signTransaction(
    params: Record<string, unknown>,
    pin: string,
  ): Promise<Record<string, unknown>>;
  signMessage(
    message: string,
    pin: string,
  ): Promise<Record<string, unknown>>;
  signTypedData(
    typedData: Record<string, unknown>,
    pin: string,
  ): Promise<Record<string, unknown>>;
}

export interface ICapabilityRegistry {
  register(capability: CapabilityDefinition): void;
  get(id: string): CapabilityDefinition | undefined;
  getAll(): CapabilityDefinition[];
  getIds(): string[];
  route(request: AuthRequest): Promise<AuthResponse>;
}

export interface INotificationService {
  registerPushToken(pairId: string): Promise<void>;
  showLocalNotification(title: string, body: string): Promise<void>;
  onNotificationTap(
    handler: (data: Record<string, unknown>) => void,
  ): () => void;
}
