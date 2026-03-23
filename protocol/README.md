# Open-Auth Protocol Specification

**Version:** 1.0 (Draft)

A universal protocol for Agent-to-Human authorization. Any Requester (AI Agent, script, service) can send authorization requests to any Authorizer (mobile app, desktop app, hardware device) over a secure end-to-end encrypted channel.

## Protocol Stack

```
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Application                                    │
│  authorize / capabilities / error codes                  │
│  Spec: application/spec.md, capability/spec.md           │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Security                                       │
│  E2EE: X25519 + HKDF-SHA256 + AES-256-GCM              │
│  Spec: security/spec.md                                  │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Transport                                      │
│  Message envelopes: pair_complete / handshake / encrypted │
│  Spec: transport/spec.md                                 │
├─────────────────────────────────────────────────────────┤
│  Layer 0: Pairing                                        │
│  Short code / QR pairing, X25519 key exchange            │
│  Spec: pairing/spec.md                                   │
└─────────────────────────────────────────────────────────┘
```

## Terminology

| Term | Definition |
|------|-----------|
| **Requester** | The party requesting authorization (AI Agent, script, service) |
| **Authorizer** | The party granting authorization (mobile app, desktop app, hardware device) — operated by a human |
| **Capability** | A named set of actions an Authorizer supports (e.g., `evm-signer`, `generic-approval`) |
| **Action** | A specific operation within a Capability (e.g., `sign_transaction`) |
| **pairId** | A deterministic channel identifier derived from both parties' communication public keys |

## Reading Guide

| Document | What It Covers |
|----------|---------------|
| [`pairing/spec.md`](pairing/spec.md) | Layer 0 — How Requester and Authorizer discover each other and establish a shared secret |
| [`transport/spec.md`](transport/spec.md) | Layer 1 — Message envelope formats and transport-agnostic framing |
| [`security/spec.md`](security/spec.md) | Layer 2 — End-to-end encryption, anti-replay, reconnection verification |
| [`application/spec.md`](application/spec.md) | Layer 3 — Authorization request/response lifecycle, error codes, context metadata |
| [`capability/spec.md`](capability/spec.md) | Capability model — How Authorizers declare capabilities, reference capabilities (`evm-signer`, `generic-approval`) |
| [`compatibility/claw-wallet.md`](compatibility/claw-wallet.md) | Compatibility guide for claw-wallet Desktop |

## Design Principles

1. **Transport-agnostic** — The protocol defines message formats, not how they travel. HTTP relay, WebSocket, Bluetooth, local IPC all work.
2. **Capability-extensible** — New authorization use cases are added as Capabilities without changing the core protocol.
3. **Human-in-the-loop** — Every authorization request is presented to a human on a trusted device. Policy engines may auto-approve within configured limits.
4. **Zero trust relay** — The relay server sees only opaque ciphertext. All application data is end-to-end encrypted.
5. **One-to-one pairing** — Each Requester pairs with exactly one Authorizer. Simple, secure, no multi-device coordination complexity.

## License

MIT
