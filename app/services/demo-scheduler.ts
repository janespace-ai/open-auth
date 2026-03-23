import { DEMO_SCHEDULED_REQUESTS } from "./demo-data";
import type { AuthRequest } from "./types";

type RequestCallback = (request: AuthRequest) => void;

export class DemoRequestScheduler {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private requestIndex = 0;
  private maxAdditional = 2;
  private callback: RequestCallback | null = null;

  start(onNewRequest: RequestCallback) {
    this.callback = onNewRequest;
  }

  onRequestHandled() {
    if (this.requestIndex >= this.maxAdditional || !this.callback) return;

    const delay = this.requestIndex === 0 ? 30_000 : 90_000;
    const request = DEMO_SCHEDULED_REQUESTS[this.requestIndex];
    if (!request) return;

    const timer = setTimeout(() => {
      const liveRequest: AuthRequest = {
        ...request,
        receivedAt: Date.now(),
      };
      this.callback?.(liveRequest);
    }, delay);

    this.timers.push(timer);
    this.requestIndex++;
  }

  stop() {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
    this.callback = null;
  }
}
