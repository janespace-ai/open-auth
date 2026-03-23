import { describe, it, expect } from "vitest";
import {
  getCapabilityDisplayName,
  getActionDisplayName,
  getChainName,
  getRiskDisplay,
  truncateAddress,
  formatTimestamp,
  groupByDate,
} from "../../utils/display";

describe("getCapabilityDisplayName", () => {
  it("returns mapped name for evm-signer", () => {
    expect(getCapabilityDisplayName("evm-signer")).toBe("Digital Signer");
  });

  it("returns the id as-is for unknown capability", () => {
    expect(getCapabilityDisplayName("unknown-thing")).toBe("unknown-thing");
  });
});

describe("getActionDisplayName", () => {
  it("returns mapped name for sign_transaction", () => {
    expect(getActionDisplayName("sign_transaction")).toBe("Sign Transaction");
  });

  it("returns the action as-is for unknown action", () => {
    expect(getActionDisplayName("unknown")).toBe("unknown");
  });
});

describe("getChainName", () => {
  it("returns Ethereum Mainnet for chain 1", () => {
    expect(getChainName(1)).toBe("Ethereum Mainnet");
  });

  it("returns Polygon for chain 137", () => {
    expect(getChainName(137)).toBe("Polygon");
  });

  it("returns fallback for unknown chain", () => {
    expect(getChainName(99999)).toBe("Network #99999");
  });
});

describe("getRiskDisplay", () => {
  it("returns Low Risk with green for low", () => {
    expect(getRiskDisplay("low")).toEqual({ label: "Low Risk", color: "#16A34A" });
  });

  it("returns Critical with dark red for critical", () => {
    expect(getRiskDisplay("critical")).toEqual({ label: "Critical", color: "#991B1B" });
  });

  it("returns fallback with gray for unknown level", () => {
    const result = getRiskDisplay("unknown");
    expect(result.label).toBe("unknown");
    expect(result.color).toBe("#6B7280");
  });
});

describe("truncateAddress", () => {
  it("truncates a long address", () => {
    const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18";
    const result = truncateAddress(addr);
    expect(result).toMatch(/^0x742d35\.\.\.f2bD18$/);
    expect(result.length).toBeLessThan(addr.length);
  });

  it("leaves a short address unchanged", () => {
    expect(truncateAddress("0xABCD")).toBe("0xABCD");
  });
});

describe("formatTimestamp", () => {
  it("returns 'Just now' for 30 seconds ago", () => {
    expect(formatTimestamp(Date.now() - 30_000)).toBe("Just now");
  });

  it("returns '5m ago' for 5 minutes ago", () => {
    expect(formatTimestamp(Date.now() - 300_000)).toBe("5m ago");
  });

  it("returns '3h ago' for 3 hours ago", () => {
    expect(formatTimestamp(Date.now() - 10_800_000)).toBe("3h ago");
  });

  it("returns '2d ago' for 2 days ago", () => {
    expect(formatTimestamp(Date.now() - 172_800_000)).toBe("2d ago");
  });
});

describe("groupByDate", () => {
  it("groups items into today, yesterday, and older", () => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const older = new Date(now);
    older.setDate(older.getDate() - 5);

    const items = [
      { id: "a", timestamp: now.getTime() },
      { id: "b", timestamp: yesterday.getTime() },
      { id: "c", timestamp: older.getTime() },
    ];

    const groups = groupByDate(items);
    expect(groups).toHaveLength(3);
    expect(groups[0].title).toBe("Today");
    expect(groups[0].data).toHaveLength(1);
    expect(groups[1].title).toBe("Yesterday");
    expect(groups[1].data).toHaveLength(1);
    expect(groups[2].data).toHaveLength(1);
  });
});
