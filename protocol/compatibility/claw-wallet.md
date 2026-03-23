# claw-wallet Compatibility Guide

This document describes how the open-auth protocol relates to the existing claw-wallet protocol and how they coexist.

## 1. Protocol Mapping

### 1.1 Terminology

| claw-wallet | open-auth |
|-------------|-----------|
| Desktop / Wallet | Authorizer |
| Agent | Requester |
| `walletAddr` | `authorizerId` |
| `commPubKey` | `publicKey` |
| `sign_transaction` | `authorize` with `capability: "evm-signer"`, `action: "sign_transaction"` |
| `sign_message` | `authorize` with `capability: "evm-signer"`, `action: "sign_message"` |
| (none) | `capabilities` query |
| (none) | `generic-approval` capability |

### 1.2 Layer Comparison

| Layer | claw-wallet | open-auth | Compatible? |
|-------|-------------|-----------|-------------|
| Pairing | Short code, X25519 | Short code + QR, X25519 | Structurally identical |
| Transport | pair_complete / handshake / encrypted | Same three types + extended pair_complete | Forward-compatible |
| Security | X25519 + HKDF("claw-wallet-e2ee-v1") + AES-256-GCM | X25519 + HKDF("open-auth-e2ee-v1") + AES-256-GCM | Different HKDF info → different keys |
| Application | `sign_transaction` / `sign_message` | `authorize` + capability + action | Different message format |

## 2. Message Format Translation

### 2.1 Sign Transaction

**claw-wallet format (inside E2EE):**

```json
{
  "requestId": "req-...",
  "method": "sign_transaction",
  "params": {
    "to": "0x...",
    "value": "1000000000000000000",
    "chainId": 8453,
    "data": "0x"
  },
  "estimatedUSD": 3200.00
}
```

**open-auth equivalent:**

```json
{
  "requestId": "req-...",
  "method": "authorize",
  "capability": "evm-signer",
  "action": "sign_transaction",
  "params": {
    "to": "0x...",
    "value": "1000000000000000000",
    "chainId": 8453,
    "data": "0x"
  },
  "context": {
    "estimatedUSD": 3200.00
  }
}
```

**Translation rules:**
- `method: "sign_transaction"` → `method: "authorize"` + `capability: "evm-signer"` + `action: "sign_transaction"`
- `params` fields are identical
- Top-level `estimatedUSD` → `context.estimatedUSD`

### 2.2 Sign Message

**claw-wallet format:**

```json
{
  "requestId": "req-...",
  "method": "sign_message",
  "params": { "message": "Hello" }
}
```

**open-auth equivalent:**

```json
{
  "requestId": "req-...",
  "method": "authorize",
  "capability": "evm-signer",
  "action": "sign_message",
  "params": { "message": "Hello" },
  "context": {}
}
```

### 2.3 Response Translation

**claw-wallet success:**
```json
{ "requestId": "req-...", "result": { "signedTx": "0x...", "address": "0x..." } }
```

**open-auth success:**
```json
{ "requestId": "req-...", "status": "approved", "result": { "signedTx": "0x...", "address": "0x..." } }
```

**Translation:** open-auth adds `status: "approved"`. The `result` payload is identical.

### 2.4 Error Code Mapping

| claw-wallet | open-auth | Notes |
|-------------|-----------|-------|
| `WALLET_LOCKED` | `AUTHORIZER_LOCKED` | Renamed for generality |
| `SESSION_FROZEN` | `SESSION_FROZEN` | Unchanged |
| `USER_REJECTED` | `USER_REJECTED` | Unchanged |
| `APPROVAL_TIMEOUT` | `APPROVAL_TIMEOUT` | Unchanged |
| `SIGN_ERROR` | `INTERNAL_ERROR` | Generalized |
| (none) | `CAPABILITY_NOT_FOUND` | New in open-auth |
| (none) | `ACTION_NOT_SUPPORTED` | New in open-auth |
| (none) | `INVALID_PARAMS` | New in open-auth |
| (none) | `POLICY_DENIED` | New in open-auth |

**claw-wallet conflates rejection and error** (both use `error` + `errorCode`). open-auth separates them:
- `USER_REJECTED` in claw-wallet → `status: "rejected"` in open-auth
- All other errors in claw-wallet → `status: "error"` in open-auth

## 3. pairId Derivation Differences

| | claw-wallet | open-auth |
|---|-------------|-----------|
| **Formula** | `sha256(walletAddress + ":" + agentPubKey)[:16]` | `sha256(authorizerCommPub + ":" + requesterCommPub)[:16]` |
| **Input** | Wallet address + Agent's X25519 public key | Both parties' X25519 public keys |
| **Collision risk** | Collides if same wallet on multiple devices | Never collides (different comm keys per device) |

These produce different pairIds for the same agent-wallet pair. This is intentional — Desktop and APP connections never share a relay channel.

### Dual-Protocol Agent SDK Guidance

An Agent SDK supporting both protocols MUST maintain separate pairing state for each:

```
Agent SDK internal state:
{
  "connections": [
    {
      "protocol": "claw-wallet/1.0",
      "pairId": "a1b2c3d4e5f67890",        // old derivation
      "targetType": "desktop",
      "walletAddress": "0xAbC...",
      "commPubKey": "...",
      "sharedSecret": "...",                 // HKDF with "claw-wallet-e2ee-v1"
    },
    {
      "protocol": "open-auth/1.0",
      "pairId": "f9e8d7c6b5a43210",        // new derivation
      "targetType": "mobile",
      "authorizerId": "0xAbC...",
      "commPubKey": "...",
      "sharedSecret": "...",                 // HKDF with "open-auth-e2ee-v1"
    }
  ]
}
```

The Agent SDK MUST:
- Use the correct pairId derivation per protocol
- Use the correct HKDF info string per protocol
- Format messages according to the target protocol
- Translate responses from old format to unified internal format

## 4. Migration Guide

### For existing claw-wallet Agent SDK adopting open-auth

**Phase 1: Add open-auth support alongside existing protocol**

1. Add open-auth pairing flow (new pairId derivation, extended `pair_complete`)
2. Add open-auth message formatting (`method: "authorize"` + capability + action)
3. Add open-auth response parsing (three-state `status` model)
4. Use HKDF info string `"open-auth-e2ee-v1"` for new pairings

**Phase 2: Unified API surface**

Expose a single API that routes to the correct protocol based on the target:

```typescript
class ClawWallet {
  async signTransaction(params: TxParams): Promise<SignResult> {
    if (this.connection.protocol === 'open-auth/1.0') {
      return this.authorizeViaOpenAuth('evm-signer', 'sign_transaction', params);
    } else {
      return this.signViaLegacy('sign_transaction', params);
    }
  }
}
```

**Phase 3 (future): Deprecate old protocol**

Once all Authorizers support open-auth, the legacy code path can be removed.

### For new Authorizer implementations

New Authorizer implementations (e.g., the open-auth mobile APP) SHOULD implement only the open-auth protocol. There is no need to support the legacy claw-wallet protocol.

### What does NOT change

- The Go relay server requires **zero changes**. It only inspects `requestId` for routing and is completely agnostic to the message content and protocol version.
- claw-wallet Desktop requires **zero changes**. It continues using its existing protocol. Only the Agent SDK needs updating to support both protocols.
