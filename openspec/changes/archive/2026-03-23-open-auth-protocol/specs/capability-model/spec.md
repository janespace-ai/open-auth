## ADDED Requirements

### Requirement: Capability declaration schema

Each Capability SHALL be declared with the following structure:

- `id` (string, REQUIRED): unique kebab-case identifier (e.g., `"evm-signer"`, `"generic-approval"`)
- `version` (string, REQUIRED): semver version string (e.g., `"1.0.0"`)
- `name` (string, REQUIRED): human-readable display name
- `description` (string, OPTIONAL): brief description of the capability
- `actions` (array, REQUIRED): list of Action definitions
- `policies` (array, OPTIONAL): list of supported policy types

#### Scenario: Valid capability declaration

- **WHEN** an Authorizer registers a capability with `id`, `version`, `name`, and at least one action
- **THEN** the capability SHALL be available for querying via the `capabilities` method and for use in `authorize` requests

#### Scenario: Capability without actions

- **WHEN** a capability is declared with an empty `actions` array
- **THEN** the Authorizer SHALL reject the capability registration as invalid

### Requirement: Action definition schema

Each Action within a Capability SHALL be defined with:

- `id` (string, REQUIRED): unique identifier within the capability (e.g., `"sign_transaction"`)
- `name` (string, REQUIRED): human-readable action name (e.g., `"Sign Transaction"`)
- `description` (string, OPTIONAL): brief description
- `paramsSchema` (object, REQUIRED): JSON-Schema-like definition of expected `params` fields, where each field specifies `type`, `display` (human-readable label), and `required` (boolean)
- `resultSchema` (object, REQUIRED): JSON-Schema-like definition of the `result` payload on approval
- `riskDisplay` (array, OPTIONAL): ordered list of param field names to highlight in the Authorizer's approval UI

#### Scenario: Action with params and result schema

- **WHEN** a Requester sends an `authorize` request matching an action's `id`
- **THEN** the Authorizer SHALL validate `params` against the action's `paramsSchema` and return `result` matching the `resultSchema` on approval

#### Scenario: Params validation failure

- **WHEN** the `params` in an `authorize` request do not conform to the action's `paramsSchema`
- **THEN** the Authorizer SHALL respond with `status: "error"` and `errorCode: "INVALID_PARAMS"`

### Requirement: Built-in capability — evm-signer

The protocol SHALL define `evm-signer` as a reference capability for EVM-compatible blockchain signing. This capability SHALL support the following actions:

**Action: `sign_transaction`**
- params: `to` (address), `value` (uint256), `chainId` (uint64), `data` (hex, optional), `gas` (uint256, optional), `gasPrice` (uint256, optional), `maxFeePerGas` (uint256, optional), `maxPriorityFeePerGas` (uint256, optional), `nonce` (uint64, optional), `type` (string, optional)
- result: `signedTx` (hex), `address` (address)
- context extensions: `estimatedUSD` (number), `token` (string), `chain` (string)

**Action: `sign_message`**
- params: `message` (string)
- result: `signature` (hex), `address` (address)

**Action: `sign_typed_data`**
- params: `domain` (object), `types` (object), `primaryType` (string), `message` (object)
- result: `signature` (hex), `address` (address)

#### Scenario: EVM sign_transaction request

- **WHEN** a Requester sends `authorize` with `capability: "evm-signer"` and `action: "sign_transaction"` with valid EVM transaction params
- **THEN** the Authorizer SHALL present the transaction details to the user and, on approval, return the signed transaction hex and signer address

#### Scenario: EVM sign_message request

- **WHEN** a Requester sends `authorize` with `capability: "evm-signer"` and `action: "sign_message"` with a `message` string
- **THEN** the Authorizer SHALL display the message to the user and, on approval, return the signature and signer address

#### Scenario: EVM sign_typed_data request

- **WHEN** a Requester sends `authorize` with `capability: "evm-signer"` and `action: "sign_typed_data"` with EIP-712 typed data
- **THEN** the Authorizer SHALL display the structured data to the user and, on approval, return the signature and signer address

### Requirement: Built-in capability — generic-approval

The protocol SHALL define `generic-approval` as a reference capability for non-cryptographic authorization. This capability SHALL support the following action:

**Action: `approve`**
- params: `description` (string, REQUIRED), `details` (object, optional)
- result: `approved` (boolean), `token` (string — one-time authorization token)

#### Scenario: Generic approval request

- **WHEN** a Requester sends `authorize` with `capability: "generic-approval"` and `action: "approve"`
- **THEN** the Authorizer SHALL display the description and details to the user and, on approval, return `approved: true` and a one-time authorization token

#### Scenario: Generic approval rejection

- **WHEN** the user rejects a generic approval request
- **THEN** the Authorizer SHALL respond with `status: "rejected"`

### Requirement: Policy type declaration

Capabilities MAY declare supported policy types. Each policy type SHALL specify:

- `type` (string): policy identifier (e.g., `"allowance"`, `"whitelist"`, `"auto_approve_low_risk"`)
- `description` (string): human-readable description
- `configSchema` (object): schema for policy configuration parameters

Policies are configured and enforced entirely on the Authorizer side. The protocol does not define a mechanism for Requesters to set or modify policies.

#### Scenario: Capability with policy support

- **WHEN** a capabilities query returns a capability with policy types
- **THEN** the Requester SHALL know which policy mechanisms the Authorizer supports for that capability, but SHALL NOT attempt to configure them remotely

### Requirement: Capability version compatibility

Requesters SHALL check the capability version from the `capabilities` response before sending requests. If the major version of a capability differs from what the Requester expects, the Requester SHOULD NOT send requests to that capability.

#### Scenario: Compatible capability version

- **WHEN** a Requester expects `evm-signer` version `1.x` and the Authorizer reports version `1.2.0`
- **THEN** the Requester SHALL proceed with requests

#### Scenario: Incompatible capability version

- **WHEN** a Requester expects `evm-signer` version `1.x` and the Authorizer reports version `2.0.0`
- **THEN** the Requester SHOULD inform the user of incompatibility and avoid sending requests to that capability
