const CAPABILITY_NAMES: Record<string, string> = {
  "evm-signer": "Digital Signer",
  "generic-approval": "General Approval",
};

const ACTION_NAMES: Record<string, string> = {
  sign_transaction: "Sign Transaction",
  sign_message: "Sign Message",
  sign_typed_data: "Sign Typed Data",
  approve: "Approve Action",
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum Mainnet",
  5: "Goerli Testnet",
  10: "Optimism",
  56: "BNB Chain",
  100: "Gnosis",
  137: "Polygon",
  42161: "Arbitrum One",
  43114: "Avalanche C-Chain",
  8453: "Base",
  11155111: "Sepolia Testnet",
};

const RISK_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Low Risk", color: "#16A34A" },
  medium: { label: "Medium Risk", color: "#D97706" },
  high: { label: "High Risk", color: "#DC2626" },
  critical: { label: "Critical", color: "#991B1B" },
};

export function getCapabilityDisplayName(id: string): string {
  return CAPABILITY_NAMES[id] ?? id;
}

export function getActionDisplayName(action: string): string {
  return ACTION_NAMES[action] ?? action;
}

export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] ?? `Network #${chainId}`;
}

export function getRiskDisplay(level: string): { label: string; color: string } {
  return RISK_LABELS[level] ?? { label: level, color: "#6B7280" };
}

export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function groupByDate<T extends { timestamp: number }>(
  items: T[]
): { title: string; data: T[] }[] {
  const groups = new Map<string, T[]>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  for (const item of items) {
    const date = new Date(item.timestamp);
    date.setHours(0, 0, 0, 0);
    let key: string;
    if (date.getTime() === today.getTime()) {
      key = "Today";
    } else if (date.getTime() === yesterday.getTime()) {
      key = "Yesterday";
    } else {
      key = date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}
