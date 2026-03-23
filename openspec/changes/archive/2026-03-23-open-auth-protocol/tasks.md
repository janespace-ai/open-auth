## 1. Project Setup

- [x] 1.1 Initialize project structure: create `protocol/` directory with subdirectories for each protocol layer (`pairing/`, `transport/`, `security/`, `application/`)
- [x] 1.2 Create `protocol/README.md` — protocol overview, layer stack diagram, and reading guide
- [x] 1.3 Update root `.gitignore` for protocol documentation project (remove Android-specific entries, add doc build artifacts if needed)

## 2. Pairing Protocol Specification

- [x] 2.1 Write `protocol/pairing/spec.md` — short-code pairing initiation, TTL, character set, relay registration format
- [x] 2.2 Write QR code pairing section — `openauth://pair?code=<shortCode>&relay=<relayUrl>` URI scheme definition
- [x] 2.3 Write X25519 key exchange section — `pair_complete` message with protocol metadata fields (`protocol`, `authorizerId`, `deviceType`, `deviceName`)
- [x] 2.4 Write pairId derivation section — `sha256(authorizerCommPub + ":" + requesterCommPub)[:16]` with test vectors
- [x] 2.5 Write persistent pairing storage section — required fields and reconnection behavior
- [x] 2.6 Add claw-wallet compatibility note — document old pairId derivation (`sha256(walletAddr + ":" + agentPub)[:16]`) for reference

## 3. Transport Protocol Specification

- [x] 3.1 Write `protocol/transport/spec.md` — three message envelope types overview
- [x] 3.2 Define `pair_complete` message format with JSON schema and field descriptions
- [x] 3.3 Define `handshake` message format — Requester-initiated and Authorizer response variants
- [x] 3.4 Define `encrypted` message format — payload field, requestId for response routing
- [x] 3.5 Write requestId correlation rules — how requestId flows through E2EE and transport layers
- [x] 3.6 Write transport agnosticism section — requirements for any conforming transport implementation

## 4. E2EE Protocol Specification

- [x] 4.1 Write `protocol/security/spec.md` — E2EE overview and cryptographic primitives
- [x] 4.2 Define X25519 ECDH shared secret derivation with test vectors
- [x] 4.3 Define HKDF-SHA256 key derivation — parameters (no salt, info: `"open-auth-e2ee-v1"`, 32-byte output) with test vectors
- [x] 4.4 Define AES-256-GCM encryption — nonce construction from sequence number (4-byte BE at positions 4-7)
- [x] 4.5 Define binary envelope format — `[4-byte seq BE][ciphertext + 16-byte auth tag]` → base64
- [x] 4.6 Define anti-replay rules — monotonic sequence, max gap 100, rejection behavior
- [x] 4.7 Define three-level reconnection verification — Level 1 (pubkey), Level 2 (machineId), Level 3 (IP policy)
- [x] 4.8 Write key material zeroing requirements

## 5. Application Protocol Specification

- [x] 5.1 Write `protocol/application/spec.md` — application layer overview
- [x] 5.2 Define `capabilities` query method — request/response format with JSON examples
- [x] 5.3 Define `authorize` request method — `capability` + `action` + `params` + `context` format
- [x] 5.4 Define three-state response model — `approved` / `rejected` / `error` with JSON examples
- [x] 5.5 Define standard error codes table — all 9 error codes with descriptions and usage guidance
- [x] 5.6 Define `context` metadata fields — `description`, `requesterName`, `urgency`, `estimatedRisk`, extensibility rules
- [x] 5.7 Write protocol version negotiation rules — major version compatibility, rejection behavior

## 6. Capability Model Specification

- [x] 6.1 Write `protocol/capability/spec.md` — capability model overview
- [x] 6.2 Define capability declaration schema — `id`, `version`, `name`, `actions`, `policies`
- [x] 6.3 Define action definition schema — `id`, `name`, `paramsSchema`, `resultSchema`, `riskDisplay`
- [x] 6.4 Write `evm-signer` reference capability — full schema for `sign_transaction`, `sign_message`, `sign_typed_data`
- [x] 6.5 Write `generic-approval` reference capability — full schema for `approve` action
- [x] 6.6 Define policy type declaration format and Authorizer-side enforcement rules
- [x] 6.7 Write capability version compatibility rules

## 7. claw-wallet Compatibility Guide

- [x] 7.1 Write `protocol/compatibility/claw-wallet.md` — mapping between claw-wallet protocol and open-auth protocol
- [x] 7.2 Document message format translation — `sign_transaction` ↔ `authorize(evm-signer, sign_transaction)`, error code mappings
- [x] 7.3 Document pairId derivation differences and dual-protocol Agent SDK guidance
- [x] 7.4 Add protocol migration guide — how an existing claw-wallet Agent SDK can adopt open-auth for new Authorizer connections
