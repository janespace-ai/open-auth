# Open-Auth Protocol: Application Layer

**Layer 3** of the Open-Auth Protocol Stack

> Status: Draft
> Version: 1.0

## 1. Overview

The Application layer defines the authorization request/response lifecycle. All messages in this layer are transmitted inside the E2EE encrypted envelope (Layer 2) and are therefore opaque to the relay and any network intermediary.

The Application layer defines two methods:

| Method | Purpose |
|--------|---------|
| `capabilities` | Query which capabilities the Authorizer supports |
| `authorize` | Request authorization for a specific action |

The key words "MUST", "SHALL", "MUST NOT", "SHOULD", and "MAY" in this document are to be interpreted as described in RFC 2119.

## 2. Capability Query

### 2.1 Request

The Requester SHALL query the Authorizer's supported capabilities by sending:

```json
{
  "requestId": "req-1711234567890-x7k2m",
  "method": "capabilities"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requestId` | string | REQUIRED | Unique request identifier |
| `method` | string | REQUIRED | MUST be `"capabilities"` |

### 2.2 Response

```json
{
  "requestId": "req-1711234567890-x7k2m",
  "result": {
    "protocol": "open-auth/1.0",
    "capabilities": [
      {
        "id": "evm-signer",
        "version": "1.0.0",
        "actions": ["sign_transaction", "sign_message", "sign_typed_data"],
        "metadata": {
          "chains": [1, 8453],
          "address": "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12"
        }
      },
      {
        "id": "generic-approval",
        "version": "1.0.0",
        "actions": ["approve"],
        "metadata": {}
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `result.protocol` | string | REQUIRED | Protocol version identifier |
| `result.capabilities` | array | REQUIRED | List of supported capabilities (MAY be empty) |
| `result.capabilities[].id` | string | REQUIRED | Capability identifier (kebab-case) |
| `result.capabilities[].version` | string | REQUIRED | Capability version (semver) |
| `result.capabilities[].actions` | string[] | REQUIRED | List of supported action IDs |
| `result.capabilities[].metadata` | object | OPTIONAL | Capability-specific metadata |

If the Authorizer has no registered capabilities, it SHALL return an empty `capabilities` array.

## 3. Authorization Request

### 3.1 Request Format

```json
{
  "requestId": "req-1711234568000-p3n8q",
  "method": "authorize",
  "capability": "evm-signer",
  "action": "sign_transaction",
  "params": {
    "to": "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12",
    "value": "1000000000000000000",
    "chainId": 8453,
    "data": "0x"
  },
  "context": {
    "description": "Swap 1 ETH for USDC on Uniswap",
    "requesterName": "Trading Agent v2",
    "urgency": "normal",
    "estimatedRisk": "medium",
    "estimatedUSD": 3200.00
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requestId` | string | REQUIRED | Unique request identifier |
| `method` | string | REQUIRED | MUST be `"authorize"` |
| `capability` | string | REQUIRED | Target capability ID |
| `action` | string | REQUIRED | Target action within the capability |
| `params` | object | REQUIRED | Action-specific parameters (schema defined by capability). MAY be empty object `{}` |
| `context` | object | OPTIONAL | Human-readable metadata to aid decision-making |

If `capability` is missing, the Authorizer SHALL respond with `errorCode: "INVALID_PARAMS"`.
If `action` is missing, the Authorizer SHALL respond with `errorCode: "INVALID_PARAMS"`.

### 3.2 Request Routing

Upon receiving an `authorize` request, the Authorizer SHALL:

1. Verify the `capability` exists → `CAPABILITY_NOT_FOUND` if not
2. Verify the `action` is supported by that capability → `ACTION_NOT_SUPPORTED` if not
3. Validate `params` against the action's parameter schema → `INVALID_PARAMS` if invalid
4. Check policy engine for auto-deny rules → `POLICY_DENIED` if denied
5. Check policy engine for auto-approve rules → return `approved` immediately if matched
6. Present the request to the user for manual decision

## 4. Three-State Response Model

All authorization responses SHALL include a `status` field with exactly one of three values.

### 4.1 Approved

Returned when the user (or policy engine) approves the request.

```json
{
  "requestId": "req-1711234568000-p3n8q",
  "status": "approved",
  "result": {
    "signedTx": "0x02f87083014a3401843b9aca00...",
    "address": "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12"
  }
}
```

The `result` payload is defined by the capability's action result schema.

### 4.2 Rejected

Returned when the user explicitly declines the request.

```json
{
  "requestId": "req-1711234568000-p3n8q",
  "status": "rejected",
  "reason": "Amount too high, I only authorized up to 0.5 ETH"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | OPTIONAL | Human-readable rejection reason |

### 4.3 Error

Returned when a system error prevents processing.

```json
{
  "requestId": "req-1711234568000-p3n8q",
  "status": "error",
  "error": "Wallet is locked. Please unlock on your device.",
  "errorCode": "AUTHORIZER_LOCKED"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `error` | string | REQUIRED | Human-readable error message |
| `errorCode` | string | REQUIRED | Machine-readable error code |

## 5. Standard Error Codes

| Error Code | Description | Typical Trigger |
|------------|-------------|-----------------|
| `AUTHORIZER_LOCKED` | Authorizer device is locked | Device screen locked, app in background without biometric unlock |
| `SESSION_FROZEN` | Session frozen due to security concern | machineId mismatch, IP policy violation |
| `USER_REJECTED` | User explicitly rejected the request | User tapped "Reject" in the approval UI |
| `APPROVAL_TIMEOUT` | Request timed out waiting for user action | No user response within the timeout window (default: 10 minutes) |
| `CAPABILITY_NOT_FOUND` | Requested capability not available | Requester asks for `ssh-signer` but Authorizer only has `evm-signer` |
| `ACTION_NOT_SUPPORTED` | Action not supported by capability | Requester asks for `sign_typed_data` but capability only supports `sign_transaction` |
| `INVALID_PARAMS` | Request parameters malformed or missing | Missing required `to` field in `sign_transaction` params |
| `POLICY_DENIED` | Policy engine automatically denied | Exceeds daily spending limit, address not on whitelist |
| `INTERNAL_ERROR` | Unexpected internal failure | Signing library crash, storage corruption |

Capabilities MAY define additional error codes. Capability-specific error codes SHOULD be prefixed with the capability ID in uppercase (e.g., `EVM_SIGNER_INSUFFICIENT_GAS`).

Requesters MUST handle unknown error codes gracefully by treating them as `INTERNAL_ERROR`.

## 6. Context Metadata

The `context` object provides human-readable information to help the user make informed decisions.

### 6.1 Standard Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Brief summary of what the action does |
| `requesterName` | string | Name of the requesting agent or service |
| `urgency` | enum | `"low"` \| `"normal"` \| `"high"` \| `"critical"` |
| `estimatedRisk` | enum | `"low"` \| `"medium"` \| `"high"` |

All standard context fields are OPTIONAL.

### 6.2 Capability-Specific Extensions

Capabilities MAY define additional context fields relevant to their domain. For example:

- `evm-signer` MAY use: `estimatedUSD` (number), `token` (string), `chain` (string)
- `generic-approval` MAY use: `category` (string), `expiresAt` (ISO 8601 timestamp)

The Authorizer SHALL display all available context information to the user alongside the authorization request. If `context` is omitted entirely, the Authorizer SHALL present the request using only the capability name, action name, and raw params.

### 6.3 Urgency Display Guidance

| Urgency | Authorizer Behavior |
|---------|-------------------|
| `low` | Standard notification, no special treatment |
| `normal` | Standard notification (default) |
| `high` | Prominent notification, MAY use sound/vibration |
| `critical` | Persistent alert, SHOULD use sound/vibration, MAY override Do Not Disturb |

## 7. Protocol Version Negotiation

### 7.1 Version Format

Protocol versions follow the format `open-auth/<major>.<minor>` (e.g., `open-auth/1.0`).

- **Major version** changes indicate breaking, incompatible protocol changes.
- **Minor version** changes indicate backward-compatible additions.

### 7.2 Version Declaration

The protocol version is declared in two places:
1. The `protocol` field in the `pair_complete` transport message (during pairing)
2. The `protocol` field in the `capabilities` response (during session)

### 7.3 Compatibility Rules

- Implementations MUST reject pairing attempts from incompatible major versions.
- Implementations SHOULD accept connections from the same major version with different minor versions.
- When a version mismatch is detected at pairing time, the Authorizer SHALL respond with an error indicating the supported version range.
- Requesters SHOULD check the `protocol` field in the `capabilities` response to confirm version compatibility before sending `authorize` requests.
