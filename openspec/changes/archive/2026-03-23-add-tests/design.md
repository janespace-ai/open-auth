## Context

The open-auth app (`app/`) is an Expo (React Native) project with TypeScript. The codebase has three distinct layers:

1. **Services** (`services/`) — E2EE engine, relay, key manager, signing engine, capabilities, notifications, mock variants, demo data/scheduler
2. **Stores** (`stores/`) — 4 Zustand stores (auth, agents, requests, history)
3. **Screens** (`app/`) — 14 screen components using Expo Router

The services layer is heavily ESM-dependent (`@noble/curves`, `@noble/ciphers`, `@noble/hashes` are all ESM-only packages). The project already has a dependency injection pattern via `ServiceContainer` with real/mock variants, which makes integration testing straightforward.

## Goals / Non-Goals

**Goals:**
- Achieve automated test coverage for all security-critical modules (E2EE, key derivation, signing)
- Validate the ServiceContainer real↔mock switching that demo mode depends on
- Validate display utility correctness (terminology mapping must not leak crypto terms)
- Enable CI-compatible test runs with a single `npm test` command
- Create E2E smoke tests for critical user flows using demo mode as test fixture

**Non-Goals:**
- UI snapshot testing (screen components change frequently, low ROI)
- React Native component unit tests with RNTL (complex setup, brittle, better covered by E2E)
- 100% code coverage target (focus on security-critical and logic-heavy modules)
- Testing real network calls to relay server (covered by integration/E2E, not unit tests)
- Native module testing (expo-secure-store, expo-local-authentication — these are mocked)

## Decisions

### 1. Test framework: Vitest

**Choice:** Vitest with Node.js environment.

**Alternatives considered:**
- Jest — rejected because `@noble/*` packages are ESM-only; Jest's ESM support requires `--experimental-vm-modules` flag and extensive `transformIgnorePatterns` configuration. Multiple open issues with `@noble/curves` + Jest.
- Bun test — rejected because Expo toolchain doesn't officially support Bun runtime.

**Key advantages:**
- Native ESM support — `@noble/*` imports work without any transforms
- Built-in TypeScript support via esbuild — no `ts-jest` needed
- Jest-compatible API — `describe`, `it`, `expect` are identical
- `vi.useFakeTimers()` for demo-scheduler timer testing

### 2. Test file structure: co-located `__tests__/` directory

**Choice:** Single `app/__tests__/` directory with `unit/` and `integration/` subdirs.

**Alternatives considered:**
- Co-located `*.test.ts` next to each source file — rejected because it clutters the Expo Router file-based routing (files in `app/app/` become routes)
- Root-level `tests/` outside `app/` — rejected because it complicates relative imports from `services/`

### 3. E2E framework: Maestro

**Choice:** Maestro with YAML flow definitions.

**Alternatives considered:**
- Detox — rejected because it requires native build configuration and is significantly more complex to set up in Expo managed workflow
- Appium — rejected because it's heavyweight and slow for the scope of tests needed

**Key advantages:**
- YAML declarative syntax — no compilation needed
- Works with Expo development builds
- Demo mode provides self-contained test data (no test server, no seed scripts)
- Can run in CI with Maestro Cloud

### 4. Mocking strategy: minimal mocking

**Choice:** Test real implementations wherever possible; only mock native modules.

Modules that need mocking:
| Module | Why mock | Mock strategy |
|--------|----------|---------------|
| `expo-secure-store` | Native module, unavailable in Node.js | In-memory Map |
| `expo-local-authentication` | Hardware-dependent | Always return `{ success: true }` |
| `expo-notifications` | Native module | No-op |
| `expo-sqlite` | Native module | In-memory store or skip |
| `WebSocket` | Network-dependent | Custom `MockWebSocket` class for relay tests |

Modules tested as-is (no mocking):
- `@noble/curves`, `@noble/ciphers`, `@noble/hashes` — run real crypto in Node.js
- `zustand` — works in Node.js without React
- `viem` — runs in Node.js natively

### 5. E2E test data strategy: use demo mode

**Choice:** All E2E tests trigger demo mode (PIN `000000`) for deterministic test data.

No external test fixtures, no test servers, no API mocking. Demo mode already provides:
- 3 pre-populated agents
- 20 history records
- 1 pending request + 2 scheduled follow-ups
- Full local operation (zero network)

## Risks / Trade-offs

**[ESM resolution edge cases]** — Some `@noble/*` sub-path imports use `.js` extensions (`@noble/curves/ed25519.js`). Vitest should resolve these natively, but if not, `resolve.alias` in vitest config can map them. → Test this during setup.

**[Timer-based tests flakiness]** — `DemoRequestScheduler` uses real `setTimeout` (30s, 90s). → Use `vi.useFakeTimers()` to advance time deterministically.

**[Maestro + Expo managed workflow]** — Maestro needs a running app (development build or standalone APK/IPA). Cannot run in pure CI without a simulator/emulator image. → Run E2E locally or in Maestro Cloud; unit/integration tests run in CI.

**[Zustand store testing outside React]** — Zustand stores can be tested without React by calling `.getState()` and `.setState()` directly. No React rendering needed. → This is a well-documented pattern.

## Open Questions

- Should we add a coverage threshold enforcement (e.g., 80% for `services/`) or keep it advisory?
- Should Maestro flows live in `app/e2e/` or a top-level `e2e/` directory?
