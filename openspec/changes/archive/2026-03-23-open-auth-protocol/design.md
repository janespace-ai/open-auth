## Context

The claw-wallet project has a working Agent-to-Desktop authorization system built around:
- X25519 key exchange + AES-256-GCM E2EE
- A Go relay server that transparently forwards encrypted messages via WebSocket
- A pairing protocol using 8-character short codes
- Two application-level methods: `sign_transaction` and `sign_message`

This system works but is tightly coupled to EVM signing. open-auth extracts the proven lower layers (pairing, transport, security) and redesigns the application layer to support any authorization use case through a Capability + Action model.

**Current claw-wallet protocol stack (implicitly layered):**

```
Application:  sign_transaction / sign_message (EVM-specific)
Security:     X25519 + HKDF("claw-wallet-e2ee-v1") + AES-256-GCM
Transport:    pair_complete / handshake / encrypted envelopes
Pairing:      short code → key exchange → pairId derivation
```

**Constraints:**
- claw-wallet Desktop continues to use its existing protocol unchanged
- The Go relay server is transport-only (peeks at `requestId`, forwards everything else opaquely) — no relay changes needed
- Agent SDK connects to either Desktop (old protocol) or APP (open-auth protocol) via one-to-one pairing
- This change defines the protocol spec only — no implementations

## Goals / Non-Goals

**Goals:**
- Define a 4-layer protocol stack (Pairing → Transport → Security → Application) that generalizes agent-to-human authorization
- Design the Application layer around a Capability + Action model that supports EVM signing, generic approval, and future use cases
- Maintain full backward compatibility with claw-wallet Desktop (old protocol) via one-to-one pairing
- Produce spec-grade protocol documents that an implementer can build against independently

**Non-Goals:**
- Implementing an Agent SDK, Relay Server, or mobile APP (future changes)
- Multi-device fan-out (Agent pairs with one Authorizer, one-to-one)
- Capability plugin/marketplace system (capabilities are Authorizer-built-in for now)
- Multi-chain standards beyond EVM (future extension, but protocol is chain-agnostic by design)

## Decisions

### 1. Four-layer protocol stack

```
Layer 3: Application    authorize / capabilities / error codes
Layer 2: Security       E2EE (X25519 + HKDF + AES-256-GCM)
Layer 1: Transport      message envelopes (pair_complete / handshake / encrypted)
Layer 0: Pairing        short code + QR, key exchange, pairId derivation
```

**Rationale:** Matches the implicit layers already in claw-wallet. Making them explicit allows each layer to be specified and versioned independently. An implementer could swap transport (e.g., Bluetooth instead of HTTP relay) without touching the upper layers.

### 2. Unified `authorize` method with Capability + Action

**Choice:** All authorization requests use `method: "authorize"` with `capability` and `action` fields, rather than having top-level methods like `sign_transaction`.

**Alternative considered:** Keep method-per-operation (`sign_transaction`, `approve_action`, etc.) — rejected because it doesn't scale and requires protocol changes for each new use case.

```json
{
  "requestId": "req-...",
  "method": "authorize",
  "capability": "evm-signer",
  "action": "sign_transaction",
  "params": { ... },
  "context": { ... }
}
```

The `capability` field routes to the right handler on the Authorizer. The `action` field specifies what operation within that capability. The `params` schema is defined by the capability. The `context` field provides human-readable metadata to help the user make an informed decision.

### 3. pairId derivation uses comm public keys

**Choice:** `pairId = sha256(authorizerCommPub + ":" + requesterCommPub)[:16]`

**Alternative considered:** claw-wallet uses `sha256(walletAddress + ":" + agentPub)[:16]` — this would collide if the same wallet address is used on multiple devices. Using comm public keys guarantees unique pairIds per pairing, even if the underlying identity is the same.

claw-wallet Desktop retains its old derivation. open-auth Authorizers use the new derivation. The relay doesn't care — pairId is just an opaque string.

### 4. Three-state response model

**Choice:** Responses have an explicit `status` field: `approved`, `rejected`, or `error`.

**Alternative considered:** claw-wallet conflates rejection and errors (both use `error` + `errorCode`). Separating them lets Requesters handle "user said no" differently from "something broke."

```
approved  → result payload included
rejected  → human deliberately declined, optional reason
error     → system failure, errorCode + error message
```

### 5. HKDF info string differentiation

**Choice:** open-auth uses `"open-auth-e2ee-v1"` as the HKDF info string, distinct from claw-wallet's `"claw-wallet-e2ee-v1"`.

**Rationale:** Even if the same X25519 key pair were accidentally reused across protocols, the derived shared secrets would differ, preventing cross-protocol message decryption.

### 6. Capability declaration at pairing time

The `pair_complete` message is extended with protocol metadata:

```json
{
  "type": "pair_complete",
  "machineId": "...",
  "agentPublicKey": "...",
  "protocol": "open-auth/1.0",
  "authorizerId": "0xAbC...",
  "deviceType": "mobile",
  "deviceName": "iPhone 15 Pro"
}
```

Full capability details are queried post-pairing via the `capabilities` method. The `pair_complete` metadata lets the Requester identify the protocol version and device type immediately.

## Risks / Trade-offs

**[Protocol versioning complexity]** → The `protocol` field in `pair_complete` and `capabilities` response includes a version string. Future breaking changes increment the major version. Implementations MUST reject unsupported major versions at pairing time rather than failing silently on individual requests.

**[Capability schema evolution]** → Capabilities define their own param/result schemas. If a capability's schema changes, the capability version must increment. Requesters check capability version before sending requests. → For v1.0, capabilities are simple and stable. A formal schema registry is a future concern.

**[claw-wallet backward compatibility surface]** → Desktop uses old pairId derivation and old message format. Agent SDK must maintain two code paths. → This is a client-side concern, not a protocol concern. The protocol spec documents both formats clearly.

**[No capability negotiation]** → The current design is "query then use" — Requester asks for capabilities, then sends requests that match. There's no negotiation or fallback. → Acceptable for v1.0. If a capability isn't available, the Requester gets `CAPABILITY_NOT_FOUND` and can inform the user.

## Open Questions

- **Capability schema formalization**: Should capabilities use JSON Schema for params/result validation, or keep it informal for v1.0?
- **Policy protocol**: Should the protocol define how policies (auto-approve rules, allowances) are communicated between Requester and Authorizer, or leave policy entirely to the Authorizer's internal implementation?
