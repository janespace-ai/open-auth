import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DemoRequestScheduler } from "../../services/demo-scheduler";
import type { AuthRequest } from "../../services/types";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DemoRequestScheduler", () => {
  let scheduler: DemoRequestScheduler;
  let received: AuthRequest[];
  let callback: (req: AuthRequest) => void;

  beforeEach(() => {
    scheduler = new DemoRequestScheduler();
    received = [];
    callback = (req) => received.push(req);
  });

  afterEach(() => {
    scheduler.stop();
  });

  it("fires callback after 30s on first onRequestHandled", () => {
    scheduler.start(callback);
    scheduler.onRequestHandled();
    vi.advanceTimersByTime(30_000);
    expect(received).toHaveLength(1);
    expect(received[0].requestId).toBeTruthy();
  });

  it("fires second callback after 90s on second onRequestHandled", () => {
    scheduler.start(callback);
    scheduler.onRequestHandled();
    vi.advanceTimersByTime(30_000);
    expect(received).toHaveLength(1);

    scheduler.onRequestHandled();
    vi.advanceTimersByTime(90_000);
    expect(received).toHaveLength(2);
  });

  it("fires at most 2 additional requests", () => {
    scheduler.start(callback);
    scheduler.onRequestHandled();
    scheduler.onRequestHandled();
    scheduler.onRequestHandled();
    vi.advanceTimersByTime(200_000);
    expect(received).toHaveLength(2);
  });

  it("stop prevents pending timers from firing", () => {
    scheduler.start(callback);
    scheduler.onRequestHandled();
    scheduler.stop();
    vi.advanceTimersByTime(60_000);
    expect(received).toHaveLength(0);
  });

  it("onRequestHandled without start does not throw", () => {
    expect(() => scheduler.onRequestHandled()).not.toThrow();
  });
});
