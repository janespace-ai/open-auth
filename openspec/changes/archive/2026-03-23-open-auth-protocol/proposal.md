## Why

AI Agents increasingly need human authorization for sensitive operations—signing blockchain transactions, approving API calls, confirming destructive actions. Today, each agent-to-human authorization system (including our own claw-wallet) invents its own proprietary protocol. There is no universal standard for "Agent requests, human authorizes on a trusted device."

open-auth defines a general-purpose authorization protocol: a standard way for any Requester (AI Agent, script, service) to send authorization requests to any Authorizer (mobile app, desktop app, hardware device) over a secure E2EE channel. Think of it as what OAuth is for web authorization, but designed for the Agent-to-human-device interaction model.

This change defines the protocol specification only. No Agent SDK, no Relay Server, no APP implementation—just the protocol itself, abstracted from the patterns already proven in claw-wallet.

## What Changes

- Define the Open-Auth Protocol Stack (4 layers: Pairing, Transport, Security, Application)
- Define the Pairing protocol: short-code and QR-based device pairing with X25519 key exchange
- Define the Transport layer: message envelope types (`pair_complete`, `handshake`, `encrypted`) that are transport-agnostic (works over HTTP relay, WebSocket, Bluetooth, etc.)
- Define the Security layer: E2EE specification using X25519 + HKDF-SHA256 + AES-256-GCM with anti-replay protection
- Define the Application layer: `capabilities` query, `authorize` request/response with Capability + Action model, standard error codes
- Define the Capability model: how Authorizers declare supported capabilities (e.g., `evm-signer`, `generic-approval`) with action schemas, display hints, and policy schemas
- Ensure backward compatibility with claw-wallet Desktop (old protocol, old pairId derivation, zero changes to Desktop)

## Capabilities

### New Capabilities
- `pairing-protocol`: Short-code and QR-based pairing flow, X25519 key exchange, pairId derivation, device identity declaration
- `transport-protocol`: Message envelope types (pair_complete, handshake, encrypted), transport-agnostic framing, requestId-based correlation
- `e2ee-protocol`: End-to-end encryption spec using X25519 + HKDF-SHA256 + AES-256-GCM, sequence-based nonce, anti-replay, three-level reconnection verification
- `application-protocol`: Capability query, authorize request/response lifecycle, standard error codes, context metadata
- `capability-model`: Capability registration schema, action definitions, parameter schemas, result schemas, display hints, policy schemas

### Modified Capabilities

(none — this is a greenfield project, no existing specs)

## Impact

- **Protocol spec files**: New specification documents defining the open-auth protocol (this repo's primary deliverable)
- **claw-wallet compatibility**: The protocol is designed to coexist with claw-wallet's existing protocol. claw-wallet Desktop requires zero changes. A future claw-wallet Agent SDK update can adopt open-auth as the underlying protocol for new Authorizer connections.
- **Future implementations**: The protocol spec will guide future development of the open-auth APP (mobile Authorizer), Agent SDK, and Relay Server enhancements.
