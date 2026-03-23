## Why

The open-auth mobile app has 43 source files across services, stores, and screens, but zero automated tests. The E2EE engine, key manager, and signing engine are security-critical modules where a regression could lead to data exposure or broken communication. App store reviewers exercise the demo mode flow, which relies on mock service injection working correctly. Without tests, every change to the codebase is a blind deployment.

## What Changes

- Add Vitest as the test framework (ESM-native, zero-config for `@noble/*` packages)
- Add ~70 unit tests covering all pure-logic modules: E2EE engine, capability registry, display utilities, Zustand stores, mock services, and demo scheduler
- Add ~10 integration tests covering E2EE duplex communication, ServiceContainer mode switching, and capability-to-signing chain
- Add Maestro E2E test flows for critical user paths: onboarding (normal + demo), authorization request handling, agent management, and settings reset
- Add CI-compatible test scripts to `package.json`

## Capabilities

### New Capabilities
- `unit-tests`: Unit test suite for all pure-logic service modules, stores, and utilities using Vitest
- `integration-tests`: Integration test suite validating cross-service interactions (E2EE duplex, container switching, capability routing chain)
- `e2e-tests`: End-to-end test flows using Maestro covering critical user paths through the app

### Modified Capabilities

_(none — this change adds test infrastructure without modifying existing behavior)_

## Impact

- **Dependencies**: `vitest` added as devDependency; Maestro installed as CLI tool (not a project dependency)
- **Files**: New `__tests__/` directory in `app/`, new `e2e/` directory in `app/`, new `vitest.config.ts`
- **CI**: Test scripts added to `package.json` (`test`, `test:unit`, `test:integration`, `test:e2e`)
- **No production code changes** — all additions are test-only files and dev dependencies
