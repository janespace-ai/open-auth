## ADDED Requirements

### Requirement: Onboarding introduction slides

The APP SHALL present a 3-step introduction sequence on first launch. Each step SHALL display an illustration, a title, and a brief description. The user SHALL be able to swipe between steps or tap a "Next" button to advance. A "Get Started" button SHALL appear on the final step to proceed to PIN setup.

#### Scenario: First launch shows onboarding

- **WHEN** the user opens the APP for the first time (no PIN configured)
- **THEN** the APP SHALL display the first onboarding slide with a "Next" button and step indicators (e.g., dots)

#### Scenario: Navigate through slides

- **WHEN** the user taps "Next" or swipes forward on a non-final slide
- **THEN** the APP SHALL advance to the next slide and update the step indicator

#### Scenario: Final slide shows Get Started

- **WHEN** the user reaches the third and final slide
- **THEN** the APP SHALL display a "Get Started" button that navigates to PIN setup

#### Scenario: Skip to Get Started

- **WHEN** the user swipes forward past all slides
- **THEN** the APP SHALL land on the final slide with the "Get Started" button visible

### Requirement: PIN setup during onboarding

The APP SHALL require the user to create a 6-digit numeric PIN during onboarding. The user MUST enter the PIN twice to confirm. The APP SHALL warn the user if the PIN is trivially simple (e.g., `000000`, `123456`) but SHALL still allow the user to proceed after acknowledgment.

#### Scenario: Enter and confirm PIN

- **WHEN** the user enters a 6-digit PIN and then re-enters the same PIN on the confirmation screen
- **THEN** the APP SHALL accept the PIN, store its hash securely, and proceed to biometric enrollment

#### Scenario: PIN confirmation mismatch

- **WHEN** the user enters a different PIN on the confirmation screen than the original
- **THEN** the APP SHALL display an error message (e.g., "PINs don't match") and allow the user to retry

#### Scenario: Trivially simple PIN warning

- **WHEN** the user enters a trivially simple PIN such as `000000` or `123456`
- **THEN** the APP SHALL display a warning (e.g., "This PIN is easy to guess. Are you sure?") with options to change or continue

#### Scenario: User continues with simple PIN

- **WHEN** the user acknowledges the simple PIN warning and chooses to continue
- **THEN** the APP SHALL accept the PIN and proceed normally

### Requirement: Biometric enrollment during onboarding

After PIN setup, the APP SHALL offer optional biometric enrollment (Face ID, Touch ID, or fingerprint depending on device hardware). The user SHALL be able to skip biometric enrollment.

#### Scenario: Device supports biometrics and user enrolls

- **WHEN** the device supports biometrics and the user taps "Enable" on the biometric enrollment screen
- **THEN** the APP SHALL trigger the system biometric prompt, and on success, store a biometric-derived key for future unlocking

#### Scenario: User skips biometric enrollment

- **WHEN** the user taps "Skip" or "Not Now" on the biometric enrollment screen
- **THEN** the APP SHALL proceed to the Home screen without enabling biometrics

#### Scenario: Device does not support biometrics

- **WHEN** the device has no biometric hardware or biometrics are not configured
- **THEN** the APP SHALL skip the biometric enrollment screen entirely and navigate to the Home screen after PIN setup

### Requirement: Home screen agent list

The Home screen SHALL display all paired agents as a scrollable list of cards. Each card SHALL show the agent name, a device type icon (e.g., desktop, server, phone), an online/offline status indicator (green dot for online, gray dot for offline), the time since the agent's last activity, and a badge with the count of pending authorization requests (if any). A "Pair New Agent" button SHALL be prominently displayed.

#### Scenario: Display paired agents

- **WHEN** the user navigates to the Home screen and at least one agent is paired
- **THEN** the APP SHALL display a card for each paired agent showing name, device type icon, status dot, last activity time, and pending request badge

#### Scenario: Agent comes online

- **WHEN** a paired agent establishes a connection through the relay
- **THEN** the APP SHALL update that agent's card to show a green status dot

#### Scenario: Agent goes offline

- **WHEN** a paired agent disconnects from the relay
- **THEN** the APP SHALL update that agent's card to show a gray status dot and display the time since last activity

#### Scenario: Agent has pending requests

- **WHEN** a paired agent has one or more pending authorization requests
- **THEN** the APP SHALL display a numeric badge on that agent's card showing the pending request count

#### Scenario: No pending requests

- **WHEN** a paired agent has no pending authorization requests
- **THEN** the APP SHALL NOT display a pending request badge on that agent's card

### Requirement: Home screen empty state

When no agents are paired, the Home screen SHALL display an empty state with an illustration, a message explaining the app's purpose (e.g., "No agents paired yet"), and a prominent call-to-action to pair the first agent.

#### Scenario: No agents paired

- **WHEN** the user navigates to the Home screen and no agents are paired
- **THEN** the APP SHALL display an empty state illustration with explanatory text and a button to begin pairing

### Requirement: Bottom tab bar navigation

The APP SHALL provide a bottom tab bar with three tabs: Home, History, and Settings. The active tab SHALL be visually distinguished. The tab bar SHALL be visible on all primary screens (Home, History, Settings).

#### Scenario: Tab navigation

- **WHEN** the user taps a tab in the bottom bar
- **THEN** the APP SHALL navigate to the corresponding screen (Home, History, or Settings) and highlight the active tab

### Requirement: Pair New Agent screen QR code generation

The Pair New Agent screen SHALL generate and display a QR code encoding an `openauth://pair` URI containing the Authorizer's pairing information. The screen SHALL also display an 8-character alphanumeric short code as a fallback pairing method. Tapping the short code SHALL copy it to the clipboard.

#### Scenario: Display QR code and short code

- **WHEN** the user navigates to the Pair New Agent screen
- **THEN** the APP SHALL generate a fresh pairing QR code and display it alongside an 8-character short code

#### Scenario: Tap to copy short code

- **WHEN** the user taps the short code
- **THEN** the APP SHALL copy the code to the clipboard and display a brief confirmation (e.g., "Copied!")

### Requirement: Pairing countdown timer

The Pair New Agent screen SHALL display a countdown timer starting from 10 minutes. When the timer expires, the pairing session SHALL be invalidated and the user SHALL be informed.

#### Scenario: Timer counts down

- **WHEN** the Pair New Agent screen is active
- **THEN** the APP SHALL display a countdown timer showing remaining time (e.g., "9:42 remaining")

#### Scenario: Timer expires

- **WHEN** the countdown reaches zero without a successful pair
- **THEN** the APP SHALL invalidate the pairing session, display a message (e.g., "Pairing session expired"), and offer to generate a new code

### Requirement: Pairing waiting state and completion

While waiting for an agent to scan the QR code, the screen SHALL show a "Waiting for agent..." animation. On receiving a `pair_complete` message, the screen SHALL display a success animation and navigate to the Home screen. The user SHALL be able to cancel pairing at any time.

#### Scenario: Waiting for agent

- **WHEN** the QR code is displayed and no agent has connected yet
- **THEN** the APP SHALL show an animated waiting indicator (e.g., pulsing dots or spinner) with the text "Waiting for agent..."

#### Scenario: Successful pairing

- **WHEN** an agent scans the QR code and the APP receives a `pair_complete` message
- **THEN** the APP SHALL display a success animation, add the new agent to the agents list, and navigate to the Home screen

#### Scenario: Cancel pairing

- **WHEN** the user taps the "Cancel" button during pairing
- **THEN** the APP SHALL abort the pairing session, clean up any temporary pairing state, and navigate back to the previous screen

### Requirement: Authorization request display

When the APP receives an authorization request, it SHALL present a full-screen prompt showing the requesting agent name, the action name (e.g., "Sign Transaction", "Approve Action"), request parameters in human-readable format, and context metadata. The screen SHALL include a prominent green "Approve" button, a secondary "Reject" button, and an expiry countdown timer.

#### Scenario: Display authorization request

- **WHEN** the APP receives an `authorize` request from a paired agent
- **THEN** the APP SHALL display the requesting agent name, action name, formatted parameters, and any context metadata (description, urgency, risk level)

#### Scenario: Display urgency badge

- **WHEN** the authorization request includes `context.urgency` set to `"high"` or `"critical"`
- **THEN** the APP SHALL display a visible urgency badge (e.g., orange for high, red for critical) near the action name

#### Scenario: Display risk level indicator

- **WHEN** the authorization request includes `context.estimatedRisk`
- **THEN** the APP SHALL display a risk level indicator (e.g., "Low Risk", "Medium Risk", "High Risk") with appropriate color coding

### Requirement: Authorization request parameter display using riskDisplay

The APP SHALL use the capability's `riskDisplay` field to determine which parameters to highlight prominently. Parameters listed in `riskDisplay` SHALL be displayed in a prominent summary section. All other parameters SHALL be available in an expandable details section.

#### Scenario: Parameters with riskDisplay hints

- **WHEN** the capability defines `riskDisplay` as `["to", "value", "chainId"]` and the request includes those params
- **THEN** the APP SHALL display those parameters prominently at the top of the request detail, using their `display` labels from the params schema

#### Scenario: Parameters without riskDisplay

- **WHEN** the capability does not define `riskDisplay`
- **THEN** the APP SHALL display all parameters in a uniform list using their `display` labels

### Requirement: EVM signer request display

For `evm-signer` authorization requests, the APP SHALL display transaction details in user-friendly terms. The APP SHALL show the "To" address (truncated with full view on tap), the numeric amount with a fiat currency estimate (if available in context), and the network name (derived from `chainId`). The APP SHALL NOT display cryptocurrency-specific terminology such as "ETH", "gas", "wei", or "gwei" in the primary UI.

#### Scenario: Display EVM sign_transaction request

- **WHEN** the APP receives an `authorize` request for `evm-signer` / `sign_transaction`
- **THEN** the APP SHALL display the "To" address, the transaction amount with fiat estimate (e.g., "$12.50"), and the network name (e.g., "Ethereum Mainnet")

#### Scenario: Display EVM sign_message request

- **WHEN** the APP receives an `authorize` request for `evm-signer` / `sign_message`
- **THEN** the APP SHALL display the message text in a readable format with a "Sign Message" action label

#### Scenario: No crypto terminology in primary view

- **WHEN** the APP displays any `evm-signer` request
- **THEN** the APP SHALL NOT show raw hex values, gas parameters, or token symbols in the primary approval view; these MAY be available in an expandable "Technical Details" section

### Requirement: Authorization request approval and rejection

The user SHALL be able to approve or reject an authorization request. Approving SHALL send an `approved` response to the agent. Rejecting SHALL send a `rejected` response. Both actions SHALL be confirmed with visual feedback and the screen SHALL dismiss.

#### Scenario: User approves request

- **WHEN** the user taps the "Approve" button
- **THEN** the APP SHALL send an `approved` response with the capability-specific result, display a brief success confirmation, and dismiss the request screen

#### Scenario: User rejects request

- **WHEN** the user taps the "Reject" button
- **THEN** the APP SHALL send a `rejected` response, display a brief confirmation, and dismiss the request screen

#### Scenario: Request expires before user action

- **WHEN** the expiry countdown reaches zero without user action
- **THEN** the APP SHALL send a timeout error response, display "Request expired", and dismiss the request screen

### Requirement: Authorization request expiry countdown

The authorization request screen SHALL display a visible countdown timer showing the time remaining to respond. The timer SHALL provide visual urgency cues as time runs low (e.g., color change when under 30 seconds).

#### Scenario: Countdown timer display

- **WHEN** the authorization request screen is displayed
- **THEN** the APP SHALL show a countdown timer with the remaining seconds

#### Scenario: Countdown urgency visual

- **WHEN** the countdown timer reaches 30 seconds or less
- **THEN** the APP SHALL change the timer's visual appearance to indicate urgency (e.g., red text or pulsing animation)

### Requirement: History screen with date-grouped list

The History screen SHALL display past authorization requests grouped by date (e.g., "Today", "Yesterday", "March 20, 2026"). Each item SHALL show a status icon (checkmark for approved, X for rejected, clock for timeout), the action name, the agent name, and the relative time (e.g., "2 hours ago").

#### Scenario: Display history items

- **WHEN** the user navigates to the History screen and history records exist
- **THEN** the APP SHALL display records grouped by date, each showing status icon, action name, agent name, and relative time

#### Scenario: Empty history

- **WHEN** the user navigates to the History screen and no history records exist
- **THEN** the APP SHALL display an empty state message (e.g., "No history yet")

### Requirement: History filtering by status

The History screen SHALL provide a filter to view records by status: All, Approved, Rejected, or Timeout.

#### Scenario: Filter by approved

- **WHEN** the user selects the "Approved" filter
- **THEN** the APP SHALL display only history records with an approved status

#### Scenario: Filter by rejected

- **WHEN** the user selects the "Rejected" filter
- **THEN** the APP SHALL display only history records with a rejected status

#### Scenario: Filter by timeout

- **WHEN** the user selects the "Timeout" filter
- **THEN** the APP SHALL display only history records that expired without user action

#### Scenario: Filter shows all

- **WHEN** the user selects the "All" filter
- **THEN** the APP SHALL display all history records regardless of status

### Requirement: History item detail view

Tapping a history item SHALL navigate to a detail view showing the full request parameters, context metadata, the user's decision (approved/rejected/timeout), and the response result (if approved).

#### Scenario: View history detail

- **WHEN** the user taps a history item
- **THEN** the APP SHALL navigate to a detail screen showing the full action name, agent name, timestamp, parameters, context, and the outcome

### Requirement: History pull-to-refresh

The History screen SHALL support pull-to-refresh to reload history records from local storage.

#### Scenario: Pull to refresh history

- **WHEN** the user performs a pull-to-refresh gesture on the History screen
- **THEN** the APP SHALL reload history records from the local database and update the displayed list

### Requirement: Agent Detail screen

The Agent Detail screen SHALL display the agent's name, device type, current online/offline status, the date the agent was paired, and device information. It SHALL list the agent's capabilities using human-readable names (e.g., "Digital Signer" for `evm-signer`, "General Approval" for `generic-approval`).

#### Scenario: Display agent detail

- **WHEN** the user navigates to the Agent Detail screen for a specific agent
- **THEN** the APP SHALL display the agent name, device type, online status indicator, paired date, device info, and capabilities list

#### Scenario: Capabilities shown with friendly names

- **WHEN** the agent supports `evm-signer` and `generic-approval`
- **THEN** the APP SHALL display "Digital Signer" and "General Approval" respectively

### Requirement: Agent Detail statistics

The Agent Detail screen SHALL display authorization statistics for the agent: total requests, approved count, rejected count, and timeout count.

#### Scenario: Display agent statistics

- **WHEN** the user views the Agent Detail screen
- **THEN** the APP SHALL display the total number of authorization requests and a breakdown by approved, rejected, and timeout

### Requirement: Agent Detail auto-approve rules link

The Agent Detail screen SHALL include an auto-approve rules section that links to Security Settings where the user can configure auto-approve policies for that agent.

#### Scenario: Navigate to auto-approve rules

- **WHEN** the user taps the auto-approve rules section on the Agent Detail screen
- **THEN** the APP SHALL navigate to the relevant section in Security Settings

### Requirement: Unpair agent with confirmation

The Agent Detail screen SHALL include an "Unpair" button. Tapping it SHALL present a confirmation dialog. Confirming SHALL remove the agent and all associated session data.

#### Scenario: Unpair with confirmation

- **WHEN** the user taps "Unpair" and confirms in the dialog
- **THEN** the APP SHALL remove the agent from the paired list, delete associated session keys and data, and navigate back to the Home screen

#### Scenario: Unpair cancelled

- **WHEN** the user taps "Unpair" but cancels in the confirmation dialog
- **THEN** the APP SHALL dismiss the dialog and remain on the Agent Detail screen

### Requirement: Security Settings PIN change

The Security Settings screen SHALL allow the user to change their PIN. The user MUST enter their current PIN before setting a new one.

#### Scenario: Change PIN successfully

- **WHEN** the user enters the correct current PIN and then enters and confirms a new 6-digit PIN
- **THEN** the APP SHALL update the stored PIN hash and display a success confirmation

#### Scenario: Current PIN incorrect

- **WHEN** the user enters an incorrect current PIN during PIN change
- **THEN** the APP SHALL display an error message and not proceed to the new PIN entry

### Requirement: Security Settings biometric toggle

The Security Settings screen SHALL provide a toggle to enable or disable biometric authentication. Enabling biometrics SHALL trigger the system biometric prompt. Disabling biometrics SHALL require the current PIN.

#### Scenario: Enable biometrics

- **WHEN** the user toggles biometrics on and completes the system biometric prompt
- **THEN** the APP SHALL store a biometric-derived unlock key and enable biometric login

#### Scenario: Disable biometrics

- **WHEN** the user toggles biometrics off and enters the correct current PIN
- **THEN** the APP SHALL remove the biometric-derived key and disable biometric login

### Requirement: Security Settings auto-lock timeout

The Security Settings screen SHALL provide an auto-lock timeout selector with options: 1 minute, 5 minutes, 15 minutes, 30 minutes, and Never. The APP SHALL lock and require PIN/biometric re-authentication after the selected period of inactivity.

#### Scenario: Set auto-lock timeout

- **WHEN** the user selects a timeout value (e.g., 5 minutes)
- **THEN** the APP SHALL save the setting and lock the app after 5 minutes of inactivity

#### Scenario: Auto-lock set to never

- **WHEN** the user selects "Never" for auto-lock
- **THEN** the APP SHALL remain unlocked until manually locked or the app is terminated

### Requirement: Security Settings IP change policy

The Security Settings screen SHALL provide an IP change policy selector with options: Block, Warn, and Allow. This controls the APP's behavior when it detects that a paired agent's IP address has changed.

#### Scenario: IP policy set to Block

- **WHEN** the IP policy is set to "Block" and a paired agent connects from a new IP address
- **THEN** the APP SHALL freeze the session and require user confirmation before accepting requests from the new IP

#### Scenario: IP policy set to Warn

- **WHEN** the IP policy is set to "Warn" and a paired agent connects from a new IP address
- **THEN** the APP SHALL display a warning notification but continue processing requests

#### Scenario: IP policy set to Allow

- **WHEN** the IP policy is set to "Allow" and a paired agent connects from a new IP address
- **THEN** the APP SHALL accept requests without any notification

### Requirement: Security Settings backup and recovery

The Security Settings screen SHALL provide a "Export Recovery Phrase" option (requiring PIN entry) and an "Import Recovery Phrase" option. Exporting SHALL display the mnemonic phrase for the user to record. Importing SHALL allow the user to enter a recovery phrase to restore their signing credentials.

#### Scenario: Export recovery phrase

- **WHEN** the user taps "Export Recovery Phrase" and enters the correct PIN
- **THEN** the APP SHALL display the mnemonic recovery phrase with a warning to store it securely

#### Scenario: Export recovery phrase with wrong PIN

- **WHEN** the user taps "Export Recovery Phrase" and enters an incorrect PIN
- **THEN** the APP SHALL display an error and not reveal the recovery phrase

#### Scenario: Import recovery phrase

- **WHEN** the user taps "Import Recovery Phrase" and enters a valid mnemonic phrase
- **THEN** the APP SHALL derive and store the signing credentials from the phrase and display a success confirmation

### Requirement: Security Settings reset all data

The Security Settings screen SHALL provide a "Reset All Data" option that performs a destructive factory reset. This SHALL require double confirmation: an initial dialog explaining the consequences and a second confirmation requiring the user to type a confirmation phrase (e.g., "RESET").

#### Scenario: Reset all data with double confirmation

- **WHEN** the user taps "Reset All Data", confirms the first dialog, and types the confirmation phrase in the second dialog
- **THEN** the APP SHALL delete all local data (agents, keys, history, settings), clear secure storage, and return to the onboarding screen

#### Scenario: Reset cancelled at first dialog

- **WHEN** the user taps "Reset All Data" but cancels the first confirmation dialog
- **THEN** the APP SHALL dismiss the dialog and remain on Security Settings

#### Scenario: Reset cancelled at second dialog

- **WHEN** the user confirms the first dialog but cancels or enters the wrong phrase in the second dialog
- **THEN** the APP SHALL dismiss the dialog and remain on Security Settings

### Requirement: About and Help screen

The About / Help screen SHALL display the app version number and provide links to: Getting Started guide, Pairing Guide, Security Model documentation, FAQ, full Documentation, Report Issue, Contact Us, Privacy Policy, Terms of Service, and Open Source Licenses.

#### Scenario: Display app version

- **WHEN** the user navigates to the About / Help screen
- **THEN** the APP SHALL display the current app version number (e.g., "Version 1.0.0")

#### Scenario: Tap documentation link

- **WHEN** the user taps any documentation link (Getting Started, Pairing Guide, Security Model, FAQ, Documentation)
- **THEN** the APP SHALL open the corresponding resource in an in-app browser or the system browser

#### Scenario: Tap Report Issue

- **WHEN** the user taps "Report Issue"
- **THEN** the APP SHALL open the issue reporting channel (e.g., email compose or web form)

#### Scenario: Tap Contact Us

- **WHEN** the user taps "Contact Us"
- **THEN** the APP SHALL open the contact channel (e.g., email compose or support page)

#### Scenario: Tap legal links

- **WHEN** the user taps "Privacy Policy", "Terms of Service", or "Open Source Licenses"
- **THEN** the APP SHALL display the corresponding legal document in an in-app browser or dedicated screen
