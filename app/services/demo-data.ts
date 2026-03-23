import type { Agent, AuthRequest, HistoryRecord } from "./types";

const now = Date.now();
const DAY = 86400000;

export const DEMO_AGENTS: Agent[] = [
  {
    id: "demo-agent-assistant-pro",
    name: "Assistant Pro",
    deviceType: "agent",
    capabilities: ["generic-approval"],
    commPubKey: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    pairedAt: now - 3 * DAY,
    lastSeen: now - 60000,
    status: "online",
  },
  {
    id: "demo-agent-data-manager",
    name: "Data Manager",
    deviceType: "agent",
    capabilities: ["generic-approval", "evm-signer"],
    commPubKey: "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3",
    pairedAt: now - 7 * DAY,
    lastSeen: now - 120000,
    status: "online",
  },
  {
    id: "demo-agent-task-runner",
    name: "Task Runner",
    deviceType: "agent",
    capabilities: ["generic-approval"],
    commPubKey: "c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    pairedAt: now - 14 * DAY,
    lastSeen: now - 2 * DAY,
    status: "offline",
  },
];

const genericOps = [
  "Send weekly summary report",
  "Archive old project files",
  "Delete expired session records",
  "Deploy staging version v2.4.1",
  "Update DNS configuration",
  "Generate database backup",
  "Sync production database replica",
  "Restart background worker service",
  "Run system diagnostics",
  "Export server access logs",
  "Clear temporary cache files",
  "Update team notification settings",
  "Rotate API access credentials",
  "Publish documentation update",
  "Schedule maintenance window",
  "Import user feedback data",
  "Compress and archive old logs",
  "Regenerate search index",
  "Validate data integrity check",
  "Send monthly analytics report",
];

export const DEMO_HISTORY: HistoryRecord[] = genericOps.map((desc, i) => ({
  id: `demo-history-${i}`,
  requestId: `demo-req-${i}`,
  agentId: DEMO_AGENTS[i % 3].id,
  agentName: DEMO_AGENTS[i % 3].name,
  capability: "generic-approval",
  action: "approve",
  description: desc,
  status: i % 5 === 4 ? "rejected" as const : "approved" as const,
  timestamp: now - (i * 0.7 * DAY),
}));

export const DEMO_INITIAL_REQUEST: AuthRequest = {
  requestId: "demo-pending-1",
  agentId: "demo-agent-assistant-pro",
  capability: "generic-approval",
  action: "approve",
  params: {
    operation: "send_report",
    target: "team@company.com",
  },
  context: {
    description: "Send weekly summary report to team@company.com",
    riskLevel: "low",
  },
  receivedAt: now - 30000,
};

export const DEMO_SCHEDULED_REQUESTS: AuthRequest[] = [
  {
    requestId: "demo-pending-2",
    agentId: "demo-agent-data-manager",
    capability: "generic-approval",
    action: "approve",
    params: {
      operation: "archive_files",
      path: "/data/projects/2024-q3",
    },
    context: {
      description: "Archive Q3 project files to cold storage",
      riskLevel: "medium",
    },
    receivedAt: now,
  },
  {
    requestId: "demo-pending-3",
    agentId: "demo-agent-task-runner",
    capability: "generic-approval",
    action: "approve",
    params: {
      operation: "restart_service",
      service: "background-worker",
    },
    context: {
      description: "Restart background worker service for maintenance",
      riskLevel: "medium",
    },
    receivedAt: now,
  },
];
