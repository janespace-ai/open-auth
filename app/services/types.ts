export interface Agent {
  id: string;
  name: string;
  deviceType: string;
  capabilities: string[];
  commPubKey: string;
  pairedAt: number;
  lastSeen: number;
  status: "online" | "offline";
}

export interface AuthRequest {
  requestId: string;
  agentId: string;
  capability: string;
  action: string;
  params: Record<string, unknown>;
  context: {
    description: string;
    riskLevel: "low" | "medium" | "high" | "critical";
    [key: string]: unknown;
  };
  receivedAt: number;
  expiresAt?: number;
}

export type AuthResponseStatus = "approved" | "rejected" | "error";

export interface AuthResponse {
  requestId: string;
  status: AuthResponseStatus;
  result?: Record<string, unknown>;
  error?: { code: string; message: string };
}

export interface HistoryRecord {
  id: string;
  requestId: string;
  agentId: string;
  agentName: string;
  capability: string;
  action: string;
  description: string;
  status: AuthResponseStatus;
  timestamp: number;
}

export interface CapabilityDefinition {
  id: string;
  displayName: string;
  actions: string[];
  handler: CapabilityHandler;
}

export interface CapabilityHandler {
  validate(params: Record<string, unknown>): { valid: boolean; error?: string };
  execute(
    action: string,
    params: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
}

export interface E2EESession {
  pairId: string;
  localPrivateKey: Uint8Array;
  localPublicKey: Uint8Array;
  remotePublicKey: Uint8Array;
  sessionKey: Uint8Array;
  sendSeq: number;
  recvSeq: number;
  highestRecvSeq: number;
}

export type MessageType = "pair_complete" | "handshake" | "encrypted";

export interface TransportMessage {
  type: MessageType;
  pairId: string;
  requestId?: string;
  payload?: string;
  data?: Record<string, unknown>;
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected";
