## 1. Project Scaffolding

- [x] 1.1 Initialize Expo project in `app/` directory with TypeScript template (`npx create-expo-app`)
- [x] 1.2 Configure `app.json` / `app.config.ts`: app name "Open Auth", bundle ID, version, Utilities category, icon placeholder
- [x] 1.3 Install core dependencies: expo-router, expo-secure-store, expo-local-authentication, expo-notifications, expo-sqlite, expo-crypto
- [x] 1.4 Install crypto dependencies: @noble/curves, @noble/ciphers, @noble/hashes, @scure/bip39, @scure/bip32, viem, react-native-get-random-values
- [x] 1.5 Install UI dependencies: nativewind, tailwindcss, react-native-reanimated, react-native-gesture-handler
- [x] 1.6 Install state management: zustand
- [x] 1.7 Configure NativeWind (tailwind.config.js, babel plugin, global CSS import)
- [x] 1.8 Set up Expo Router file-based routing structure: `app/(onboarding)/`, `app/(tabs)/`, individual screens
- [x] 1.9 Configure EAS Build (`eas.json`) for development, preview, and production profiles
- [x] 1.10 Verify crypto polyfill: import react-native-get-random-values at entry point, test @noble/curves X25519 key generation

## 2. Service Layer — Core Services

- [x] 2.1 Create `ServiceContainer` with dependency injection: interface for all services, real vs mock swap based on demo flag
- [x] 2.2 Implement E2EE Engine (`services/e2ee.ts`): X25519 key pair generation, ECDH shared secret, HKDF-SHA256 derivation (info: "open-auth-e2ee-v1"), AES-256-GCM encrypt/decrypt, sequence-based nonce, binary envelope encode/decode, anti-replay validation
- [x] 2.3 Implement Key Manager (`services/key-manager.ts`): BIP-39 mnemonic generation (12 words), mnemonic import + validation, HD derivation (BIP-44 m/44'/60'/0'/0/0), scrypt-based PIN encryption, expo-secure-store read/write, key zeroing after use
- [x] 2.4 Implement Signing Engine (`services/signing.ts`): sign EVM transaction (viem privateKeyToAccount), sign message (EIP-191), sign typed data (EIP-712), key retrieval from Key Manager, immediate key cleanup
- [x] 2.5 Implement Relay Connection Service (`services/relay.ts`): WebSocket connect/disconnect, auto-reconnect with exponential backoff, heartbeat (30s ping), message send/receive, peer_disconnected handling, foreground-only lifecycle
- [x] 2.6 Implement Capability Registry (`services/capabilities.ts`): register evm-signer and generic-approval at startup, route authorize requests, respond to capabilities query, validate params per capability
- [x] 2.7 Implement Notification Service (`services/notifications.ts`): expo-notifications setup, FCM/APNs token registration, generic alert on background notification, app open on tap, request fetch after wake

## 3. State Management

- [x] 3.1 Create `useAuthStore` (zustand): PIN hash storage, lock/unlock state, biometric enabled flag, isDemoMode flag, auto-lock timeout setting
- [x] 3.2 Create `useAgentsStore` (zustand + expo-sqlite): CRUD for paired agents, online/offline status tracking, capabilities per agent, pairing metadata
- [x] 3.3 Create `useRequestsStore` (zustand, in-memory): pending authorization requests queue, add/remove requests, request expiry timer management
- [x] 3.4 Create `useHistoryStore` (zustand + expo-sqlite): authorization history records, date-grouped queries, filter by status, add record on approve/reject/timeout
- [x] 3.5 Initialize SQLite database schema: agents table, history table, settings table

## 4. Screens — Onboarding

- [x] 4.1 Implement Welcome slides screen (`(onboarding)/index.tsx`): 3-step horizontal pager with illustrations, progress dots, "Get Started" button on last slide
- [x] 4.2 Implement PIN setup screen (`(onboarding)/setup-pin.tsx`): 6-digit PIN entry, confirm PIN, "PIN too simple" warning for 000000 (allow anyway), navigate to biometric setup on success
- [x] 4.3 Implement biometric enrollment prompt: detect available biometric type (Face ID / Touch ID / fingerprint), prompt to enable, "Skip" option, on complete navigate to Home
- [x] 4.4 Wire demo mode trigger: if PIN == 000000, set isDemoMode, inject mock services, pre-populate database, navigate to Home

## 5. Screens — Core

- [x] 5.1 Implement Home screen (`(tabs)/index.tsx`): agent list from useAgentsStore, agent cards with name/status/last activity/pending badge, "Pair New Agent" button, empty state illustration
- [x] 5.2 Implement tab bar layout (`(tabs)/_layout.tsx`): three tabs — Home, History, Settings — with icons
- [x] 5.3 Implement Pair New Agent screen (`pair.tsx`): generate X25519 key pair, call relay POST /pair/create, display QR code (openauth:// URI), display short code with copy, countdown timer, listen for pair_complete on WebSocket, success animation + navigate to Home
- [x] 5.4 Implement Authorization Request screen (`request/[id].tsx`): display agent name, action name, params (using riskDisplay hints), context metadata (description, urgency, risk), Approve button (green), Reject button, expiry countdown
- [x] 5.5 Implement evm-signer display: show "To" address (truncated), numeric amount with fiat estimate, network name (from chainId mapping), "Sign Transaction" / "Sign Message" / "Sign Typed Data" labels. No crypto terminology.
- [x] 5.6 Implement generic-approval display: show description, details object formatted as key-value list, risk level indicator
- [x] 5.7 Implement approve flow: on approve tap → check if capability needs signing → call Signing Engine → encrypt response via E2EE → send via Relay → save to history → navigate back
- [x] 5.8 Implement reject flow: on reject tap → encrypt rejected response → send via Relay → save to history → navigate back

## 6. Screens — History & Agent Detail

- [x] 6.1 Implement History screen (`(tabs)/history.tsx`): date-grouped list from useHistoryStore, status icons (✓/✗/⏱), action name, agent name, relative time, filter tabs (All/Approved/Rejected/Timeout), pull-to-refresh
- [x] 6.2 Implement History detail (tap on item): full params, context, result/reason, timestamp
- [x] 6.3 Implement Agent Detail screen (`agent/[id].tsx`): agent info card (name, type, status, paired date, device), capabilities list ("Digital Signer", "General Approval"), statistics (total/approved/rejected/timeout), link to auto-approve rules in Settings, Unpair button with confirmation

## 7. Screens — Settings & About

- [x] 7.1 Implement Security Settings screen (`(tabs)/settings.tsx`): PIN change (require current PIN), biometric toggle, auto-lock timeout selector, IP change policy selector
- [x] 7.2 Implement Backup section: "Export Recovery Phrase" (require PIN verification, show 12 words), "Import Recovery Phrase" (12-word input, validate, derive keys, save)
- [x] 7.3 Implement Auto-approve rules section: per-agent toggle, low-risk-only option
- [x] 7.4 Implement Reset All Data: double confirmation dialog, clear all stores + secure-store + sqlite, restart to onboarding
- [x] 7.5 Implement About / Help screen (`about.tsx`): app version, help links (Getting Started, Pairing Guide, Security Model, FAQ), support links, legal links (Privacy Policy, Terms of Service, Open Source)

## 8. Demo Mode

- [x] 8.1 Implement MockRelayService: simulate WebSocket connection (always "connected"), simulate incoming encrypted messages (pre-built payloads), no actual network calls
- [x] 8.2 Implement MockKeyManager: in-memory mock keys, mock mnemonic "abandon abandon abandon..." for display, mock signing credentials
- [x] 8.3 Implement MockSigningEngine: return deterministic mock signatures for any sign request
- [x] 8.4 Implement MockNotificationService: local notification scheduling, no FCM/APNs registration
- [x] 8.5 Create demo data seed: 3 agents with metadata, 20 history records (all generic operations, zero crypto references), 1 pending request from "Assistant Pro"
- [x] 8.6 Implement mock request scheduler: after first approve/reject, schedule new request at 30s; after second, schedule at 90s; max 2 additional requests
- [x] 8.7 Wire demo mode into ServiceContainer: on isDemoMode flag, swap all real services for mocks, seed database

## 9. App Store Compliance & Polish

- [x] 9.1 Create terminology mapping utility: function that maps internal capability/action names to display names ("evm-signer" → "Digital Signer", etc.), chainId to network name mapping
- [ ] 9.2 Create app icon and splash screen (placeholder, replace with final design later)
- [ ] 9.3 Write Privacy Policy page (hosted URL) and Terms of Service page (hosted URL)
- [x] 9.4 Configure EAS Submit for App Store and Google Play
- [ ] 9.5 Prepare store listing: app name, short description, full description, Utilities category, screenshots (generic-approval focused)
- [ ] 9.6 Write Review Notes for app submission: test PIN 000000, demo experience description
- [x] 9.7 Lock screen implementation: on app foreground after auto-lock timeout, require PIN or biometric before showing content

## 10. Integration & Testing

- [ ] 10.1 End-to-end test: pair with claw-wallet relay server, receive real encrypted request, approve, verify signed response
- [ ] 10.2 Demo mode walkthrough: fresh install → PIN 000000 → verify all demo data → approve request → verify new requests appear → verify history
- [ ] 10.3 Security audit: verify key material zeroing, verify no secrets in SQLite, verify secure-store usage, verify no crypto terms in UI strings
- [ ] 10.4 Build and test on iOS simulator and Android emulator
- [ ] 10.5 Build production APK/IPA via EAS Build and test on real devices
