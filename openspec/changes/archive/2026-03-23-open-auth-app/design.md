## Context

The open-auth protocol specification is complete (`protocol/`), defining a 4-layer stack for Agent-to-Human authorization. This design covers the mobile APP implementation — the Authorizer endpoint where humans approve or reject agent requests.

The APP is built with Expo (React Native) to maximize code reuse with claw-wallet's existing TypeScript cryptographic libraries. It must pass App Store and Google Play review as a Utilities category app with zero financial/crypto appearance.

**Key constraints:**
- 8 screens, each with substantive content
- All crypto/financial terminology hidden behind neutral labels (e.g., "Digital Signer" not "EVM Signer")
- Demo mode (PIN `000000`) with pre-populated data for app store reviewers
- Reuse `@noble/*`, `viem`, `@scure/*` from claw-wallet for E2EE and signing

## Goals / Non-Goals

**Goals:**
- Implement a fully functional open-auth Authorizer as a mobile app (iOS + Android)
- Support `evm-signer` and `generic-approval` capabilities
- Pass app store review in Utilities category
- Provide a seamless demo experience for reviewers
- Reuse claw-wallet cryptographic code (zero crypto reimplementation)

**Non-Goals:**
- Agent SDK implementation (separate project)
- Relay server changes (reuse claw-wallet's Go relay as-is)
- Custom capability plugin system (capabilities are built-in for v1.0)
- Web/desktop version of the Authorizer
- Multi-language i18n (English only for v1.0)

## Decisions

### 1. Tech stack: Expo SDK 52+ with TypeScript

**Choice:** Expo managed workflow with EAS Build/Submit.

**Alternatives considered:**
- Flutter — rejected because crypto code would need complete rewrite from TypeScript to Dart
- React Native bare — rejected because Expo provides superior toolchain (cloud builds, OTA updates, built-in modules)
- Native (Swift + Kotlin) — rejected because double the work and crypto code rewrite

**Key dependencies:**

| Purpose | Package |
|---------|---------|
| Framework | expo ~52, expo-router ~4 |
| UI styling | nativewind ~4 (Tailwind CSS for RN) |
| State management | zustand |
| Secure storage | expo-secure-store |
| Biometrics | expo-local-authentication |
| Push notifications | expo-notifications |
| Local database | expo-sqlite |
| E2EE crypto | @noble/curves, @noble/ciphers, @noble/hashes |
| EVM signing | viem, @scure/bip39, @scure/bip32 |
| Crypto polyfill | react-native-get-random-values |

### 2. Navigation: Expo Router with file-based routing

```
app/
├── (onboarding)/
│   ├── index.tsx          # Welcome slides
│   └── setup-pin.tsx      # PIN + biometric setup
├── (tabs)/
│   ├── _layout.tsx        # Tab bar layout
│   ├── index.tsx          # Home (agent list)
│   ├── history.tsx        # History
│   └── settings.tsx       # Security settings
├── pair.tsx               # Pair new agent
├── request/[id].tsx       # Authorization request detail
├── agent/[id].tsx         # Agent detail
└── about.tsx              # About / Help
```

### 3. State architecture: Zustand stores

Four stores, each responsible for a domain:

| Store | Responsibility | Persistence |
|-------|---------------|-------------|
| `useAuthStore` | PIN hash, lock state, biometric enabled, demo mode flag | expo-secure-store |
| `useAgentsStore` | Paired agent list, online status, capabilities | expo-sqlite |
| `useRequestsStore` | Pending authorization requests | in-memory (ephemeral) |
| `useHistoryStore` | Authorization history records | expo-sqlite |

### 4. Service layer architecture

```
Services (dependency-injectable for demo mode):

RelayService (interface)
├── RealRelayService     → WebSocket to relay server
└── MockRelayService     → Local simulation for demo

KeyManager (interface)
├── RealKeyManager       → expo-secure-store + Keychain/Keystore
└── MockKeyManager       → In-memory mock keys for demo

SigningEngine (interface)
├── RealSigningEngine    → viem signing with real keys
└── MockSigningEngine    → Returns mock signatures for demo

NotificationService (interface)
├── RealNotificationService → expo-notifications + FCM/APNs
└── MockNotificationService → Local notification scheduling for demo
```

All services accessed through a `ServiceContainer` that swaps real/mock based on demo mode flag.

### 5. Demo mode: triggered by PIN 000000

When user enters PIN `000000` during first-time setup:
- Set `isDemoMode = true` in auth store
- Inject all mock services into ServiceContainer
- Pre-populate SQLite with 3 agents + 20 history records
- Schedule 1 pending request immediately, then 2 more at 30s and 90s intervals
- All operations are local — zero network requests
- No visual indicator of demo mode (reviewer sees a "real" experience)

### 6. App store strategy

**Category:** Utilities (same as Google Authenticator)

**UI terminology mapping:**

| Internal | Displayed |
|----------|-----------|
| `evm-signer` | Digital Signer |
| `sign_transaction` | Sign Transaction |
| `sign_message` | Sign Message |
| `chainId` | Network |
| wallet address | Your identity |
| mnemonic / seed phrase | Recovery Phrase |
| private key | Signing credential |
| ETH / token amounts | Numeric value + fiat estimate only |

**Screenshot strategy:** Use `generic-approval` screenshots for store listing (agent requesting "Send weekly report to team"). Never screenshot `evm-signer` actions.

### 7. Push notification architecture

```
Agent sends request → Relay receives →
  Relay sends push via FCM/APNs (notification-only, no data) →
    Phone wakes APP → APP connects WebSocket → APP receives encrypted request
```

Push notifications contain NO sensitive data — just a generic alert ("New authorization request"). The actual request content is fetched over E2EE WebSocket after the app opens.

### 8. Key storage architecture

```
expo-secure-store (backed by Keychain / Keystore):
├── pin_hash          → bcrypt hash of user PIN
├── comm_private_key  → X25519 communication private key (per pairing)
├── wallet_keystore   → AES-256-GCM encrypted keystore (contains HD wallet private key)
│                       encryption key derived from PIN via scrypt
└── biometric_key     → Key to unlock wallet_keystore via biometrics

expo-sqlite (not encrypted, no secrets):
├── agents table      → pairId, name, deviceType, capabilities, commPubKey, status
├── history table     → requestId, agentId, action, status, timestamp, summary
└── settings table    → auto_lock_timeout, ip_policy, auto_approve_rules
```

## Risks / Trade-offs

**[Expo version lock-in]** → Expo SDK upgrades sometimes break native modules. → Pin to SDK 52, upgrade deliberately. EAS Build isolates from local environment issues.

**[WebSocket reliability on mobile]** → iOS aggressively suspends background apps, breaking WebSocket. → Don't rely on persistent WebSocket. Use push notifications to wake app, establish WebSocket on foreground only.

**[Crypto polyfill performance]** → `@noble/*` runs in JS, not native. May be slow for key derivation (scrypt). → Acceptable for mobile — scrypt runs once at unlock, signing is fast. If needed, expo-crypto provides native randomness.

**[App store rejection risk]** → Despite neutral terminology, Apple/Google could still flag the app. → Mitigation: submit with generic-approval screenshots only, list category as Utilities, provide clear review notes. If rejected, appeal with explanation that the app is an authorization tool (like 2FA), not a financial app.

**[Demo mode discovery by users]** → Regular users could enter PIN 000000 and see demo data. → Low risk: they would need to factory-reset to exit demo mode. Add a warning "PIN too simple, are you sure?" during setup (but still allow it for reviewers).

## Open Questions

- Should the relay server URL be configurable in the app, or hardcoded to the claw-wallet relay?
- Should we add a "dark mode" toggle, or follow system preference?
