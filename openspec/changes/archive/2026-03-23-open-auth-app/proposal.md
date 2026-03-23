## Why

The open-auth protocol specification is complete, but there is no Authorizer implementation that humans can actually use. The protocol needs a mobile APP — the primary way users will approve or reject AI Agent authorization requests from their phone.

This APP must:
- Implement the open-auth protocol (pairing, E2EE, capability-based authorization)
- Include the `evm-signer` capability for claw-wallet compatibility (importing wallet keys, signing EVM transactions)
- Include the `generic-approval` capability for general agent authorization
- Pass Apple App Store and Google Play review with zero financial/crypto appearance
- Provide a demo mode (triggered by PIN `000000`) with pre-populated data for app store reviewers

## What Changes

- Create an Expo (React Native) mobile application in `app/` directory
- Implement 8 screens: Onboarding, Home, Pair New Agent, Authorization Request, History, Agent Detail, Security Settings, About/Help
- Implement open-auth protocol client: pairing flow, E2EE engine (X25519 + HKDF + AES-256-GCM), WebSocket relay connection
- Implement capability handlers: `evm-signer` (sign_transaction, sign_message, sign_typed_data) and `generic-approval` (approve)
- Implement secure key management: BIP-39 mnemonic generation/import, HD derivation, encrypted storage via iOS Keychain / Android Keystore
- Implement security features: PIN + biometric authentication, auto-lock, three-level reconnection verification, IP change policy
- Implement push notifications (FCM + APNs) for incoming authorization requests
- Implement demo mode with mock services and pre-populated data for app store review
- Reuse cryptographic code from claw-wallet (`@noble/curves`, `@noble/ciphers`, `@noble/hashes`, `viem`, `@scure/bip39`, `@scure/bip32`)

## Capabilities

### New Capabilities
- `app-onboarding`: First-launch experience with 3-step introduction, PIN setup, and optional biometric enrollment
- `app-home`: Agent list screen showing paired agents with online/offline status and pending request indicators
- `app-pairing`: QR code and short-code pairing flow, X25519 key exchange, persistent pairing storage
- `app-authorization`: Authorization request presentation, approval/rejection UI, capability-aware display (Digital Signer, General Approval), risk level visualization
- `app-history`: Authorization history with date grouping, filtering, and detail view
- `app-agent-management`: Agent detail view with capabilities, statistics, auto-approve rules configuration, and unpair functionality
- `app-security`: PIN and biometric authentication, auto-lock timeout, IP change policy, backup (recovery phrase export), import (recovery phrase entry)
- `app-demo-mode`: Pre-populated demo data (3 agents, 20+ history records, 1 pending request), mock relay service, mock request scheduler, triggered by PIN 000000
- `app-relay-connection`: WebSocket connection management to relay server, reconnection with three-level verification, heartbeat
- `app-e2ee-engine`: E2EE implementation (X25519 + HKDF-SHA256 + AES-256-GCM), anti-replay, binary envelope encoding, reused from claw-wallet
- `app-key-manager`: BIP-39 mnemonic generation/import, HD key derivation (BIP-44), secure storage via expo-secure-store, key zeroing
- `app-signing-engine`: EVM transaction and message signing via viem, key retrieval from secure storage, immediate key cleanup
- `app-notifications`: Push notification registration (FCM + APNs), incoming request notification handling, app wake-up on notification tap

### Modified Capabilities

(none — greenfield implementation)

## Impact

- **New directory**: `app/` containing the full Expo project
- **Dependencies**: expo, expo-router, expo-secure-store, expo-local-authentication, expo-notifications, expo-sqlite, zustand, @noble/curves, @noble/ciphers, @noble/hashes, viem, @scure/bip39, @scure/bip32, nativewind
- **Build infrastructure**: EAS Build configuration for iOS and Android
- **App store assets**: Icon, screenshots, descriptions, privacy policy (needed for submission)
- **claw-wallet compatibility**: The `evm-signer` capability makes this APP a drop-in replacement for claw-wallet's planned mobile app
- **Protocol specs**: References `protocol/` specs for all protocol behavior; no protocol changes needed
