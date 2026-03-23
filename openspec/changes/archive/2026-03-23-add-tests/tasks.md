## 1. Test Infrastructure Setup

- [x] 1.1 Install Vitest and configure: `npm install -D vitest` in `app/`, create `vitest.config.ts` with ESM support and path aliases
- [x] 1.2 Create `__tests__/setup.ts` with native module mocks: `expo-secure-store` (in-memory Map), `expo-local-authentication` (stub), `expo-notifications` (no-op), `expo-sqlite` (no-op)
- [x] 1.3 Add test scripts to `package.json`: `test` (all), `test:unit` (unit only), `test:integration` (integration only), `test:coverage` (with coverage report)
- [x] 1.4 Verify Vitest can import `@noble/curves/ed25519.js` and run a minimal crypto test

## 2. Unit Tests — E2EE Engine

- [x] 2.1 Test `generateKeyPair`: correct key sizes (32 bytes each), uniqueness across calls
- [x] 2.2 Test `computeSessionKey`: symmetric derivation (A→B equals B→A), session key is 32 bytes
- [x] 2.3 Test `encrypt` → `decrypt` round trip: single message, multi-message (10), UTF-8 content, empty string
- [x] 2.4 Test sequence counter: auto-increment on encrypt, independent send/recv counters
- [x] 2.5 Test anti-replay: reject same seq, reject lower seq, reject seq > highest + 100
- [x] 2.6 Test payload validation: reject too-short payload
- [x] 2.7 Test binary envelope format: first 4 bytes are big-endian seq number
- [x] 2.8 Test `createSession`: all counters initialize to 0, sessionKey is non-zero

## 3. Unit Tests — Capability Registry

- [x] 3.1 Test register + get: registered capability is retrievable by ID
- [x] 3.2 Test getAll / getIds: returns all registered capabilities
- [x] 3.3 Test route to unknown capability: returns UNSUPPORTED_CAPABILITY error
- [x] 3.4 Test route with invalid params: returns INVALID_PARAMS error
- [x] 3.5 Test route with successful handler: returns approved + result
- [x] 3.6 Test route with handler exception: returns EXECUTION_ERROR
- [x] 3.7 Test route generic-approval handler: returns approved with token

## 4. Unit Tests — Display Utilities

- [x] 4.1 Test `getCapabilityDisplayName`: known IDs map correctly, unknown IDs fall back to raw value
- [x] 4.2 Test `getActionDisplayName`: all 4 known actions map correctly, unknown falls back
- [x] 4.3 Test `getChainName`: known chain IDs (1, 137, 42161), unknown falls back to "Network #N"
- [x] 4.4 Test `getRiskDisplay`: all 4 levels return correct label and color, unknown falls back to gray
- [x] 4.5 Test `truncateAddress`: long address truncated, short address unchanged
- [x] 4.6 Test `formatTimestamp`: just now (<60s), minutes, hours, days, weeks
- [x] 4.7 Test `groupByDate`: items grouped into Today, Yesterday, and date sections

## 5. Unit Tests — Zustand Stores

- [x] 5.1 Test `useAuthStore`: setOnboarded, setLocked, setDemoMode, setPinHash, setBiometricEnabled, reset
- [x] 5.2 Test `useAgentsStore`: addAgent, removeAgent, updateAgent, getAgent, setAgents, reset
- [x] 5.3 Test `useRequestsStore`: addRequest, removeRequest, getRequest, clearAll
- [x] 5.4 Test `useHistoryStore`: addRecord, setRecords, getByAgent, reset

## 6. Unit Tests — Mock Services

- [x] 6.1 Test `MockRelayService`: connect sets "connected", disconnect sets "disconnected", onMessage/onStatusChange return unsubscribe functions
- [x] 6.2 Test `MockKeyManager`: hasWallet returns true, getAddress returns fixed address, generateMnemonic returns known mnemonic, zeroKey fills with zeros
- [x] 6.3 Test `MockSigningEngine`: all 3 sign methods return mock signature + address
- [x] 6.4 Test `MockCapabilityRegistry`: route always returns approved
- [x] 6.5 Test `MockE2EEEngine`: encrypt → decrypt round trip via base64
- [x] 6.6 Test `MockNotificationService`: all methods callable without error

## 7. Unit Tests — Demo Scheduler

- [x] 7.1 Test first request fires after 30s (using vi.useFakeTimers)
- [x] 7.2 Test second request fires after 90s
- [x] 7.3 Test no more requests after maximum (2 additional)
- [x] 7.4 Test stop clears pending timers
- [x] 7.5 Test onRequestHandled without start does not throw

## 8. Integration Tests — E2EE Duplex Communication

- [x] 8.1 Test two independent sessions derive identical session keys
- [x] 8.2 Test Alice→Bob message delivery with real crypto
- [x] 8.3 Test Bob→Alice message delivery with real crypto
- [x] 8.4 Test 10-message bidirectional exchange with alternating senders
- [x] 8.5 Test cross-session isolation: different session cannot decrypt another session's messages

## 9. Integration Tests — ServiceContainer & Capability Chain

- [x] 9.1 Test initializeServices(demoMode=false): isDemoMode is false, services are real types
- [x] 9.2 Test initializeServices(demoMode=true): isDemoMode is true, services are mock types
- [x] 9.3 Test mode switch: second initialize overrides first
- [x] 9.4 Test capability registry with mock signing: register generic-approval handler, route request, verify approved response
- [x] 9.5 Test capability registry validation rejection: register handler with strict validation, route invalid request, verify INVALID_PARAMS

## 10. E2E Tests — Maestro Flows

- [ ] 10.1 Install Maestro CLI and verify it can connect to a development build
- [x] 10.2 Write `onboarding-normal.yaml`: welcome slides → PIN 123456 → skip biometric → empty Home
- [x] 10.3 Write `onboarding-demo.yaml`: welcome slides → PIN 000000 → confirm warning → skip biometric → Home with 3 agents
- [x] 10.4 Write `demo-approve-request.yaml`: open Assistant Pro → open pending request → tap Approve → verify history entry
- [x] 10.5 Write `agent-detail.yaml`: tap Data Manager → verify capabilities and stats → Unpair → confirm → verify removed
- [x] 10.6 Write `settings-reset.yaml`: Settings tab → Reset All Data → confirm × 2 → verify back at onboarding
