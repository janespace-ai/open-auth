## ADDED Requirements

### Requirement: Demo mode trigger

When the user enters PIN `000000` during first-time onboarding setup, the app SHALL enter demo mode. The app SHALL show a "PIN is too simple" warning but SHALL allow the user to proceed with this PIN.

#### Scenario: User enters demo PIN during onboarding

- **WHEN** a user reaches the PIN setup step during first-time onboarding and enters `000000`
- **THEN** the app SHALL display a "PIN is too simple" warning, allow the user to confirm, and activate demo mode upon confirmation

#### Scenario: User enters demo PIN outside of onboarding

- **WHEN** a user enters `000000` as their PIN in any context other than first-time setup (e.g., unlock screen, PIN change)
- **THEN** the app SHALL NOT enter demo mode; the PIN SHALL be treated as a normal PIN

### Requirement: Pre-populated agents

Demo mode SHALL create 3 mock agents immediately upon activation:

| Name | Status | Capabilities | Paired | Pending Requests |
|------|--------|-------------|--------|-----------------|
| Assistant Pro | online | General Approval | 3 days ago | 1 |
| Data Manager | online | General Approval, Digital Signer | 1 week ago | 0 |
| Task Runner | offline | General Approval | 2 weeks ago | 0 |

#### Scenario: Home screen displays mock agents

- **WHEN** demo mode is active and the user views the Home screen
- **THEN** the app SHALL display all 3 mock agents with their correct names, online/offline status, capabilities, pairing age, and pending request count

#### Scenario: Agent detail view in demo mode

- **WHEN** the user taps on a mock agent in demo mode
- **THEN** the app SHALL display the agent detail screen with the agent's capabilities, pairing date, and statistics consistent with the mock history data

### Requirement: Pre-populated history

Demo mode SHALL create 20 history records spanning 2 weeks. All records SHALL use generic operations such as: send reports, archive data, delete records, deploy versions, update configurations, generate backups, sync databases, restart services, run diagnostics, export logs.

No history record SHALL reference cryptocurrency, blockchain, token transfers, wallet operations, or financial transactions.

#### Scenario: History screen displays mock records

- **WHEN** demo mode is active and the user views the History screen
- **THEN** the app SHALL display 20 history records grouped by date, spanning approximately 2 weeks of activity

#### Scenario: History records use only generic operations

- **WHEN** the user inspects any history record in demo mode
- **THEN** the record SHALL describe a generic operation (e.g., "Send weekly summary report", "Archive old project files") and SHALL NOT contain any cryptocurrency or financial terminology

### Requirement: Pending authorization request

Demo mode SHALL present 1 pending authorization request on first launch with the following attributes:

- **Agent**: Assistant Pro
- **Action**: Approve Action
- **Description**: "Send weekly summary report to team@company.com"
- **Risk level**: Low

#### Scenario: Pending request displayed on entry

- **WHEN** demo mode activates and the user reaches the Home screen
- **THEN** the app SHALL indicate 1 pending request on "Assistant Pro" and SHALL present the authorization request when the user taps through

#### Scenario: Pending request detail view

- **WHEN** the user opens the pending request from "Assistant Pro"
- **THEN** the app SHALL display action "Approve Action", description "Send weekly summary report to team@company.com", and risk level "Low", with Approve and Reject buttons

### Requirement: Simulated new requests

After the user approves or rejects the initial pending request, demo mode SHALL schedule new mock authorization requests at 30-second and 90-second intervals (maximum 2 additional requests). Each new request SHALL originate from a different agent and describe a different generic operation.

#### Scenario: First simulated request after initial decision

- **WHEN** the user approves or rejects the initial pending request
- **THEN** the app SHALL present a new mock authorization request from a different agent approximately 30 seconds later

#### Scenario: Second simulated request

- **WHEN** the first simulated request has been presented
- **THEN** the app SHALL present a second mock authorization request from the remaining agent approximately 90 seconds after the initial decision

#### Scenario: No further requests after maximum

- **WHEN** both simulated requests have been presented (2 additional total)
- **THEN** the app SHALL NOT schedule any further mock requests

### Requirement: No network requests in demo mode

Demo mode SHALL make zero network requests. All protocol operations, relay communication, push notification registration, and data persistence SHALL use mock implementations that operate entirely locally.

#### Scenario: Network isolation in demo mode

- **WHEN** demo mode is active
- **THEN** the app SHALL NOT initiate any HTTP, WebSocket, or other network connections

#### Scenario: Relay operations in demo mode

- **WHEN** the app attempts to communicate with the relay server during demo mode
- **THEN** the MockRelayService SHALL handle the operation locally and return simulated responses

### Requirement: No visual indicator of demo mode

Demo mode SHALL NOT display any banner, badge, label, watermark, or other visual indicator that the app is running in demo mode. The user experience SHALL be visually identical to a real user's experience.

#### Scenario: Home screen appearance

- **WHEN** demo mode is active
- **THEN** the Home screen SHALL be indistinguishable from a real user's Home screen with 3 paired agents

#### Scenario: All screens free of demo indicators

- **WHEN** demo mode is active and the user navigates to any screen
- **THEN** no screen SHALL contain text, icons, or styling that indicates demo mode

### Requirement: Mock service injection

Demo mode SHALL inject the following mock service implementations via `ServiceContainer`:

| Real Service | Mock Replacement |
|-------------|-----------------|
| RelayService | MockRelayService |
| KeyManager | MockKeyManager |
| SigningEngine | MockSigningEngine |
| NotificationService | MockNotificationService |

All mock services SHALL implement the same interface as their real counterparts and SHALL return plausible simulated data.

#### Scenario: ServiceContainer provides mock services in demo mode

- **WHEN** demo mode is active and any component requests a service from `ServiceContainer`
- **THEN** the `ServiceContainer` SHALL return the mock implementation instead of the real service

#### Scenario: Mock services conform to real interfaces

- **WHEN** a mock service is injected in demo mode
- **THEN** the mock service SHALL implement every method of the corresponding real service interface, returning well-formed simulated responses

### Requirement: Exit demo mode

To exit demo mode, the user MUST navigate to Security Settings and select "Reset All Data". This action SHALL clear all demo data, all app state, and restart the onboarding flow as if the app were freshly installed.

#### Scenario: User resets from demo mode

- **WHEN** demo mode is active and the user goes to Security Settings → Reset All Data and confirms
- **THEN** the app SHALL delete all demo data, clear all stored state, and present the first-time onboarding screen

#### Scenario: No other exit path

- **WHEN** demo mode is active
- **THEN** there SHALL be no other mechanism to exit demo mode besides Reset All Data
