import type { IRelayService } from "./interfaces";
import type { ConnectionStatus } from "./types";

const DEFAULT_BASE_URL = "wss://relay.openauth.dev";
const HEARTBEAT_INTERVAL_MS = 30_000;
const PONG_TIMEOUT_MS = 10_000;
const BACKOFF_CAP_MS = 30_000;

export class RelayService implements IRelayService {
  private baseUrl: string;
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private pairId: string | null = null;
  private intentionalClose = false;

  private messageHandlers = new Set<(message: string) => void>();
  private statusHandlers = new Set<(status: ConnectionStatus) => void>();

  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private awaitingPong = false;

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  connect(pairId: string): Promise<void> {
    this.pairId = pairId;
    this.intentionalClose = false;
    return this.openConnection();
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.clearTimers();
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  send(message: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected");
    }
    this.ws.send(message);
  }

  onMessage(handler: (message: string) => void): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  private openConnection(): Promise<void> {
    this.setStatus("connecting");

    return new Promise<void>((resolve, reject) => {
      const url = `${this.baseUrl}/ws?pairId=${this.pairId}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        this.ws = ws;
        this.reconnectAttempt = 0;
        this.setStatus("connected");
        this.startHeartbeat();
        resolve();
      };

      ws.onclose = (event) => {
        this.clearTimers();
        this.ws = null;

        if (this.status === "connecting") {
          this.setStatus("disconnected");
          reject(new Error(`WebSocket closed during connect: code ${event.code}`));
          return;
        }

        this.setStatus("disconnected");

        if (!this.intentionalClose) {
          this.scheduleReconnect();
        }
      };

      ws.onerror = () => {
        // onclose fires after onerror, so actual handling happens there
      };

      ws.onmessage = (event) => {
        if (event.data === "pong") {
          this.awaitingPong = false;
          this.clearPongTimer();
          return;
        }

        for (const handler of this.messageHandlers) {
          try {
            handler(event.data as string);
          } catch {
            // handler errors should not break the relay
          }
        }
      };
    });
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const handler of this.statusHandlers) {
      try {
        handler(status);
      } catch {
        // handler errors should not break the relay
      }
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeatTimer();
    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      this.awaitingPong = true;
      this.ws.send("ping");

      this.pongTimer = setTimeout(() => {
        if (this.awaitingPong) {
          this.ws?.close();
        }
      }, PONG_TIMEOUT_MS);
    }, HEARTBEAT_INTERVAL_MS);
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose || !this.pairId) return;

    const delayMs = Math.min(
      1000 * Math.pow(2, this.reconnectAttempt),
      BACKOFF_CAP_MS,
    );
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      if (this.intentionalClose) return;
      this.openConnection().catch(() => {
        // openConnection rejection triggers onclose which calls scheduleReconnect
      });
    }, delayMs);
  }

  private clearTimers(): void {
    this.clearHeartbeatTimer();
    this.clearPongTimer();
    this.clearReconnectTimer();
  }

  private clearHeartbeatTimer(): void {
    if (this.heartbeatTimer != null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearPongTimer(): void {
    if (this.pongTimer != null) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
