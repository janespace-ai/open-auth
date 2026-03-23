## ADDED Requirements

### Requirement: App store category

The app SHALL be submitted under the **Utilities** category on both Apple App Store and Google Play Store.

#### Scenario: App Store submission

- **WHEN** the app is submitted to the Apple App Store
- **THEN** the primary category SHALL be Utilities

#### Scenario: Google Play submission

- **WHEN** the app is submitted to Google Play
- **THEN** the app category SHALL be Utilities (or the closest equivalent, "Tools")

### Requirement: No financial terminology in UI

The app UI SHALL NOT contain any of the following words or phrases: cryptocurrency, crypto, wallet, blockchain, token, DeFi, NFT, or any specific cryptocurrency names (including but not limited to ETH, BTC, USDC, SOL, MATIC).

This prohibition applies to all user-visible text including screen titles, labels, descriptions, buttons, error messages, placeholder text, and tooltips.

#### Scenario: Screen text audit

- **WHEN** any screen in the app is rendered
- **THEN** no user-visible text element SHALL contain any prohibited financial terminology

#### Scenario: Error messages

- **WHEN** the app displays an error message to the user
- **THEN** the error message SHALL NOT contain any prohibited financial terminology

#### Scenario: Search and filter UI

- **WHEN** the user interacts with search, filter, or sort controls
- **THEN** all labels, options, and results SHALL be free of prohibited financial terminology

### Requirement: Capability display names

The app SHALL display capability and action identifiers using the following human-readable names in all user-facing contexts:

| Internal Identifier | Display Name |
|---|---|
| `evm-signer` | Digital Signer |
| `generic-approval` | General Approval |
| `sign_transaction` | Sign Transaction |
| `sign_message` | Sign Message |
| `sign_typed_data` | Sign Typed Data |

#### Scenario: Capability shown on agent detail

- **WHEN** an agent's capabilities are displayed on the agent detail screen
- **THEN** `evm-signer` SHALL appear as "Digital Signer" and `generic-approval` SHALL appear as "General Approval"

#### Scenario: Action shown on authorization request

- **WHEN** an authorization request is displayed to the user
- **THEN** action identifiers SHALL be rendered using their display names (e.g., `sign_transaction` as "Sign Transaction")

#### Scenario: Internal identifiers never shown

- **WHEN** any capability or action identifier is rendered in the UI
- **THEN** the raw internal identifier (e.g., `evm-signer`, `sign_typed_data`) SHALL NOT be displayed to the user

### Requirement: Value display format

Numeric values in authorization requests SHALL be displayed as plain numbers with an optional fiat currency estimate in parentheses (e.g., "1.0 (≈ $3,200)"). No cryptocurrency unit names (ETH, BTC, wei, gwei, etc.) SHALL appear in user-visible value displays.

#### Scenario: Transaction value display

- **WHEN** a `sign_transaction` request includes a `value` field
- **THEN** the app SHALL display the value as a plain number with an optional fiat estimate, without cryptocurrency unit names

#### Scenario: Zero value display

- **WHEN** a `sign_transaction` request has a value of zero
- **THEN** the app SHALL display the value as "0" or "0.0" without any unit suffix

### Requirement: Network display format

Chain identifiers (`chainId`) SHALL be displayed as human-readable network names. The app SHALL maintain a mapping of known chain IDs to display names.

| chainId | Display Name |
|---|---|
| 1 | Ethereum Mainnet |
| 8453 | Base |
| 10 | Optimism |
| 42161 | Arbitrum One |
| 137 | Polygon |

Unknown chain IDs SHALL be displayed as "Network {chainId}" (e.g., "Network 56"). The terms "EVM Chain", "Blockchain", or "Chain ID" SHALL NOT appear in user-facing UI.

#### Scenario: Known network display

- **WHEN** an authorization request includes `chainId: 8453`
- **THEN** the app SHALL display the network as "Base"

#### Scenario: Unknown network display

- **WHEN** an authorization request includes an unrecognized `chainId`
- **THEN** the app SHALL display the network as "Network {chainId}" (e.g., "Network 56")

#### Scenario: Prohibited network terminology

- **WHEN** any screen displays a network name
- **THEN** the text SHALL NOT include "EVM Chain", "Blockchain", "Chain ID", or similar technical terminology

### Requirement: Recovery phrase terminology

Mnemonic phrases and seed phrases SHALL be labeled "Recovery Phrase" in all user-facing UI contexts. The export operation SHALL be labeled "Export Backup". The import operation SHALL be labeled "Import Backup".

The terms "mnemonic", "seed phrase", "BIP-39", or "HD wallet" SHALL NOT appear in user-facing UI.

#### Scenario: Backup export flow

- **WHEN** the user navigates to export their recovery phrase
- **THEN** the feature SHALL be labeled "Export Backup" and the phrase SHALL be described as "Recovery Phrase"

#### Scenario: Backup import flow

- **WHEN** the user navigates to import a recovery phrase
- **THEN** the feature SHALL be labeled "Import Backup" and the input prompt SHALL reference "Recovery Phrase"

#### Scenario: Prohibited seed phrase terminology

- **WHEN** the recovery phrase is referenced anywhere in the UI
- **THEN** the text SHALL NOT use the terms "mnemonic", "seed phrase", "BIP-39", or "HD wallet"

### Requirement: Key terminology

Private keys SHALL be referred to as "signing credentials" in all user-visible UI text. The term "private key" SHALL NOT appear in any user-facing screen, dialog, error message, or help text.

#### Scenario: Key reference in settings

- **WHEN** the Security Settings screen references the user's cryptographic keys
- **THEN** the text SHALL use the term "signing credentials" instead of "private key" or "secret key"

#### Scenario: Key-related error messages

- **WHEN** an error occurs related to key operations
- **THEN** the error message SHALL refer to "signing credentials" and SHALL NOT use the term "private key"

### Requirement: Store listing screenshots

Screenshots submitted for app store review SHALL show `generic-approval` requests with generic operation descriptions (e.g., "Send weekly report", "Archive old files", "Deploy staging environment"). Screenshots SHALL NOT show `evm-signer` requests, transaction signing, or any content referencing financial operations.

#### Scenario: Screenshot content for authorization screen

- **WHEN** a screenshot is prepared showing the authorization request screen
- **THEN** the screenshot SHALL depict a `generic-approval` request with a generic action description

#### Scenario: Screenshot exclusion of Digital Signer

- **WHEN** screenshots are prepared for store submission
- **THEN** no screenshot SHALL display a Digital Signer (evm-signer) authorization request

### Requirement: Review notes for app submission

The app store submission SHALL include reviewer notes containing:

1. The test PIN (`000000`) to trigger demo mode
2. A brief description of the demo experience and what the reviewer will see

#### Scenario: App Store review notes

- **WHEN** the app is submitted to the Apple App Store
- **THEN** the review notes field SHALL include the demo PIN and a description of the demo experience

#### Scenario: Google Play review notes

- **WHEN** the app is submitted to Google Play
- **THEN** the submission SHALL include equivalent review instructions with the demo PIN

### Requirement: Required legal pages

The app SHALL include a Privacy Policy and Terms of Service, both accessible from the About screen. Both documents SHALL be hosted at publicly accessible URLs and SHALL load within the app via an in-app browser or webview.

#### Scenario: Privacy Policy accessibility

- **WHEN** the user navigates to the About screen
- **THEN** a "Privacy Policy" link SHALL be visible and SHALL open the privacy policy hosted at a public URL

#### Scenario: Terms of Service accessibility

- **WHEN** the user navigates to the About screen
- **THEN** a "Terms of Service" link SHALL be visible and SHALL open the terms of service hosted at a public URL

#### Scenario: Legal pages load successfully

- **WHEN** the user taps Privacy Policy or Terms of Service
- **THEN** the document SHALL load and display within the app without requiring an external browser

### Requirement: Content rating

The app SHALL be rated appropriate for all ages on both app stores. The app SHALL NOT contain gambling mechanics, restricted content, age-gated material, or any content that would result in an age-restricted rating.

#### Scenario: App Store content rating

- **WHEN** the app's content rating questionnaire is completed for the Apple App Store
- **THEN** the app SHALL qualify for a 4+ age rating

#### Scenario: Google Play content rating

- **WHEN** the app's content rating questionnaire is completed for Google Play
- **THEN** the app SHALL qualify for an "Everyone" rating
