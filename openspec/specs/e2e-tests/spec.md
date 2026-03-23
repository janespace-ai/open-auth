## ADDED Requirements

### Requirement: Normal onboarding E2E flow

The E2E test suite SHALL verify the complete onboarding flow for a new user.

#### Scenario: Welcome slides and PIN setup

- **WHEN** the app is launched fresh and the user swipes through 3 welcome slides, taps "Get Started", enters PIN 123456, confirms PIN 123456, and skips biometric setup
- **THEN** the app SHALL navigate to the Home screen showing an empty state with "No agents paired yet"

### Requirement: Demo mode onboarding E2E flow

The E2E test suite SHALL verify the complete demo mode activation flow.

#### Scenario: Demo mode activation with PIN 000000

- **WHEN** the app is launched fresh, the user completes welcome slides, enters PIN 000000, confirms the "PIN too simple" warning, and skips biometric setup
- **THEN** the Home screen SHALL display 3 agents: "Assistant Pro" (online), "Data Manager" (online), "Task Runner" (offline)

#### Scenario: Demo history is populated

- **WHEN** demo mode is active and the user navigates to the History tab
- **THEN** the History screen SHALL display records with generic operation descriptions and no cryptocurrency terminology

### Requirement: Authorization request handling E2E flow

The E2E test suite SHALL verify the approve/reject flow for authorization requests in demo mode.

#### Scenario: Approve pending request

- **WHEN** demo mode is active, the user taps "Assistant Pro", opens the pending request, and taps "Approve"
- **THEN** the request SHALL be removed from pending, a new history record with status "approved" SHALL appear in History, and the user SHALL be navigated back

#### Scenario: Reject pending request

- **WHEN** demo mode is active, the user opens a pending request and taps "Reject"
- **THEN** the request SHALL be removed from pending, a new history record with status "rejected" SHALL appear in History

### Requirement: Agent management E2E flow

The E2E test suite SHALL verify agent detail and unpair functionality in demo mode.

#### Scenario: View agent detail

- **WHEN** demo mode is active and the user taps "Data Manager"
- **THEN** the Agent Detail screen SHALL display capabilities "General Approval" and "Digital Signer", paired date, and request statistics

#### Scenario: Unpair agent

- **WHEN** the user taps "Unpair Agent" on the agent detail screen and confirms
- **THEN** the agent SHALL be removed and the Home screen SHALL show one fewer agent

### Requirement: Settings reset E2E flow

The E2E test suite SHALL verify the "Reset All Data" functionality.

#### Scenario: Full data reset

- **WHEN** demo mode is active, the user navigates to Settings, taps "Reset All Data", and confirms twice
- **THEN** the app SHALL return to the first-time onboarding welcome screen with all data cleared
