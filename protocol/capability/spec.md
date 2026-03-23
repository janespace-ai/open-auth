# Open-Auth Protocol: Capability Model

> Status: Draft
> Version: 1.0

## 1. Overview

The Capability model defines how Authorizers declare what they can do. Each Capability is a named set of Actions that an Authorizer supports. Requesters discover available Capabilities via the `capabilities` query (defined in application/spec.md) and target specific Capabilities and Actions in `authorize` requests.

The key words "MUST", "SHALL", "MUST NOT", "SHOULD", and "MAY" in this document are to be interpreted as described in RFC 2119.

## 2. Capability Declaration Schema

Each Capability SHALL be declared with the following structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | REQUIRED | Unique kebab-case identifier (e.g., `"evm-signer"`) |
| `version` | string | REQUIRED | Semver version string (e.g., `"1.0.0"`) |
| `name` | string | REQUIRED | Human-readable display name |
| `description` | string | OPTIONAL | Brief description of the capability |
| `actions` | Action[] | REQUIRED | List of action definitions (minimum 1) |
| `policies` | PolicyType[] | OPTIONAL | List of supported policy types |

A Capability with an empty `actions` array is invalid and SHALL be rejected during registration.

### Example

```json
{
  "id": "evm-signer",
  "version": "1.0.0",
  "name": "EVM Wallet Signer",
  "description": "Signs Ethereum-compatible blockchain transactions and messages",
  "actions": [ ... ],
  "policies": [ ... ]
}
```

## 3. Action Definition Schema

Each Action within a Capability SHALL be defined with:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | REQUIRED | Unique action identifier within the capability |
| `name` | string | REQUIRED | Human-readable action name |
| `description` | string | OPTIONAL | Brief description of what this action does |
| `paramsSchema` | object | REQUIRED | Schema defining expected `params` fields |
| `resultSchema` | object | REQUIRED | Schema defining the `result` payload on approval |
| `riskDisplay` | string[] | OPTIONAL | Ordered list of param field names to highlight in the approval UI |

### Parameter Schema Format

Each field in `paramsSchema` SHALL specify:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Data type: `"string"`, `"address"`, `"uint256"`, `"uint64"`, `"hex"`, `"boolean"`, `"object"`, `"array"` |
| `display` | string | Human-readable label for the approval UI |
| `required` | boolean | Whether this parameter is required (default: `false`) |
| `description` | string | Additional description (optional) |

### Example Action

```json
{
  "id": "sign_message",
  "name": "Sign Message",
  "description": "Sign an arbitrary message with the wallet's private key",
  "paramsSchema": {
    "message": {
      "type": "string",
      "display": "Message",
      "required": true,
      "description": "The message to sign"
    }
  },
  "resultSchema": {
    "signature": {
      "type": "hex",
      "display": "Signature"
    },
    "address": {
      "type": "address",
      "display": "Signer Address"
    }
  },
  "riskDisplay": ["message"]
}
```

## 4. Reference Capability: `evm-signer`

The `evm-signer` capability provides EVM-compatible blockchain signing.

### 4.1 Capability Declaration

```json
{
  "id": "evm-signer",
  "version": "1.0.0",
  "name": "EVM Wallet Signer",
  "description": "Signs Ethereum-compatible transactions, messages, and typed data",
  "actions": [
    { "id": "sign_transaction", "name": "Sign Transaction", ... },
    { "id": "sign_message", "name": "Sign Message", ... },
    { "id": "sign_typed_data", "name": "Sign Typed Data", ... }
  ],
  "policies": [
    { "type": "allowance", ... },
    { "type": "whitelist", ... }
  ]
}
```

### 4.2 Action: `sign_transaction`

Signs an EVM transaction and returns the signed transaction bytes.

**Parameters:**

| Field | Type | Required | Display | Description |
|-------|------|----------|---------|-------------|
| `to` | address | REQUIRED | Recipient | Destination address |
| `value` | uint256 | REQUIRED | Amount (wei) | Transaction value in wei |
| `chainId` | uint64 | REQUIRED | Chain | EVM chain identifier |
| `data` | hex | optional | Call Data | Contract call data |
| `gas` | uint256 | optional | Gas Limit | Gas limit |
| `gasPrice` | uint256 | optional | Gas Price | Legacy gas price (wei) |
| `maxFeePerGas` | uint256 | optional | Max Fee | EIP-1559 max fee per gas |
| `maxPriorityFeePerGas` | uint256 | optional | Priority Fee | EIP-1559 priority fee |
| `nonce` | uint64 | optional | Nonce | Transaction nonce |
| `type` | string | optional | Tx Type | Transaction type (`"legacy"`, `"eip1559"`, `"eip2930"`) |
| `accessList` | array | optional | Access List | EIP-2930 access list |

**Result:**

| Field | Type | Display | Description |
|-------|------|---------|-------------|
| `signedTx` | hex | Signed Transaction | RLP-encoded signed transaction |
| `address` | address | Signer | Address that signed the transaction |

**Context Extensions:**

| Field | Type | Description |
|-------|------|-------------|
| `estimatedUSD` | number | Estimated transaction value in USD |
| `token` | string | Token symbol (e.g., `"ETH"`, `"USDC"`) |
| `chain` | string | Human-readable chain name (e.g., `"Base"`, `"Ethereum"`) |

**Risk Display:** `["to", "value", "chainId", "estimatedUSD"]`

**Example Request:**

```json
{
  "requestId": "req-1711234568000-p3n8q",
  "method": "authorize",
  "capability": "evm-signer",
  "action": "sign_transaction",
  "params": {
    "to": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "value": "0",
    "chainId": 1,
    "data": "0xa9059cbb000000000000000000000000...",
    "maxFeePerGas": "30000000000",
    "maxPriorityFeePerGas": "2000000000",
    "gas": "65000",
    "type": "eip1559"
  },
  "context": {
    "description": "Transfer 100 USDT to 0xAbC...",
    "requesterName": "Payment Agent",
    "urgency": "normal",
    "estimatedRisk": "low",
    "estimatedUSD": 100.00,
    "token": "USDT",
    "chain": "Ethereum"
  }
}
```

**Example Response:**

```json
{
  "requestId": "req-1711234568000-p3n8q",
  "status": "approved",
  "result": {
    "signedTx": "0x02f87083014a3401843b9aca0085...",
    "address": "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12"
  }
}
```

### 4.3 Action: `sign_message`

Signs an arbitrary message using personal_sign (EIP-191).

**Parameters:**

| Field | Type | Required | Display |
|-------|------|----------|---------|
| `message` | string | REQUIRED | Message |

**Result:**

| Field | Type | Display |
|-------|------|---------|
| `signature` | hex | Signature |
| `address` | address | Signer |

**Risk Display:** `["message"]`

### 4.4 Action: `sign_typed_data`

Signs EIP-712 typed structured data.

**Parameters:**

| Field | Type | Required | Display | Description |
|-------|------|----------|---------|-------------|
| `domain` | object | REQUIRED | Domain | EIP-712 domain separator |
| `types` | object | REQUIRED | Types | EIP-712 type definitions |
| `primaryType` | string | REQUIRED | Primary Type | The primary type being signed |
| `message` | object | REQUIRED | Message | The structured data to sign |

**Result:**

| Field | Type | Display |
|-------|------|---------|
| `signature` | hex | Signature |
| `address` | address | Signer |

**Risk Display:** `["primaryType", "domain"]`

## 5. Reference Capability: `generic-approval`

The `generic-approval` capability provides non-cryptographic authorization for any action that needs human approval.

### 5.1 Capability Declaration

```json
{
  "id": "generic-approval",
  "version": "1.0.0",
  "name": "Generic Approval",
  "description": "Human approval for arbitrary agent actions",
  "actions": [
    { "id": "approve", "name": "Approve Action", ... }
  ],
  "policies": [
    { "type": "auto_approve_low_risk", ... }
  ]
}
```

### 5.2 Action: `approve`

**Parameters:**

| Field | Type | Required | Display | Description |
|-------|------|----------|---------|-------------|
| `description` | string | REQUIRED | Description | What the agent wants to do |
| `details` | object | optional | Details | Additional structured details |

**Result:**

| Field | Type | Display | Description |
|-------|------|---------|-------------|
| `approved` | boolean | Approved | Always `true` for approved responses |
| `token` | string | Auth Token | One-time authorization token |

**Risk Display:** `["description"]`

**Example Request:**

```json
{
  "requestId": "req-1711234569000-m2k7p",
  "method": "authorize",
  "capability": "generic-approval",
  "action": "approve",
  "params": {
    "description": "Delete all records from staging database table 'user_sessions'",
    "details": {
      "database": "staging-db",
      "table": "user_sessions",
      "rowCount": 15420,
      "operation": "DELETE"
    }
  },
  "context": {
    "description": "Database cleanup: remove expired sessions",
    "requesterName": "Maintenance Agent",
    "urgency": "low",
    "estimatedRisk": "medium"
  }
}
```

**Example Response:**

```json
{
  "requestId": "req-1711234569000-m2k7p",
  "status": "approved",
  "result": {
    "approved": true,
    "token": "oat_7f3k9m2p5n8q1x4w6v0b"
  }
}
```

## 6. Policy Type Declaration

Capabilities MAY declare supported policy types. Policies are configured and enforced entirely on the Authorizer side. The protocol does NOT define a mechanism for Requesters to remotely set or modify policies.

### 6.1 Policy Type Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | REQUIRED | Policy identifier |
| `description` | string | REQUIRED | Human-readable description |
| `configSchema` | object | REQUIRED | Schema for configuration parameters |

### 6.2 Reference Policy Types

#### `allowance`

Automatic approval for transactions within spending limits.

```json
{
  "type": "allowance",
  "description": "Auto-approve transactions within spending limits",
  "configSchema": {
    "daily_limit_usd": { "type": "number", "description": "Maximum daily spend in USD" },
    "per_tx_limit_usd": { "type": "number", "description": "Maximum per-transaction spend in USD" }
  }
}
```

#### `whitelist`

Automatic approval for transactions to whitelisted addresses.

```json
{
  "type": "whitelist",
  "description": "Auto-approve transactions to whitelisted addresses",
  "configSchema": {
    "addresses": { "type": "array", "items": "address", "description": "Whitelisted destination addresses" }
  }
}
```

#### `auto_approve_low_risk`

Automatic approval for requests with low estimated risk.

```json
{
  "type": "auto_approve_low_risk",
  "description": "Auto-approve requests where context.estimatedRisk is 'low'",
  "configSchema": {}
}
```

### 6.3 Policy Enforcement

- The Authorizer SHALL evaluate policies BEFORE presenting the request to the user.
- If a policy auto-approves the request, the Authorizer SHALL return `status: "approved"` without user interaction.
- If a policy auto-denies the request, the Authorizer SHALL return `status: "error"` with `errorCode: "POLICY_DENIED"`.
- If no policy matches, the Authorizer SHALL present the request to the user for manual decision.
- Multiple policies MAY be active simultaneously. Deny policies SHALL take precedence over approve policies.

## 7. Capability Version Compatibility

### 7.1 Version Format

Capability versions follow semantic versioning (`major.minor.patch`):

- **Major**: Breaking changes to params or result schema
- **Minor**: New optional fields added, backward-compatible
- **Patch**: Documentation or description changes only

### 7.2 Compatibility Rules

- Requesters SHALL check the capability version from the `capabilities` response before sending requests.
- If the **major version** differs from what the Requester expects, the Requester SHOULD NOT send requests to that capability and SHOULD inform the user of the incompatibility.
- If the **minor version** differs, the Requester MAY proceed. New optional fields in params will be ignored by older Authorizers; new optional fields in results may be absent.
- Requesters MUST handle unknown fields in results gracefully (ignore them).
- Authorizers MUST handle unknown fields in params gracefully (ignore them).
