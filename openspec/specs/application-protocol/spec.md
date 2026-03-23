## ADDED Requirements

### Requirement: Capability query method

The Requester SHALL be able to query the Authorizer for supported capabilities by sending a request with `method: "capabilities"`.

Request format:
```json
{
  "requestId": "<string>",
  "method": "capabilities"
}
```

Response format:
```json
{
  "requestId": "<string>",
  "result": {
    "protocol": "open-auth/1.0",
    "capabilities": [
      {
        "id": "<string>",
        "version": "<semver>",
        "actions": ["<string>", ...],
        "metadata": { ... }
      }
    ]
  }
}
```

#### Scenario: Query supported capabilities

- **WHEN** the Requester sends a `capabilities` request after pairing
- **THEN** the Authorizer SHALL respond with the full list of supported capabilities, each including `id`, `version`, and supported `actions`

#### Scenario: Empty capabilities

- **WHEN** the Authorizer has no registered capabilities (bare authorization device)
- **THEN** the Authorizer SHALL respond with an empty `capabilities` array

### Requirement: Authorize request method

All authorization requests SHALL use the unified `method: "authorize"` with `capability`, `action`, and `params` fields.

Request format:
```json
{
  "requestId": "<string>",
  "method": "authorize",
  "capability": "<capability-id>",
  "action": "<action-id>",
  "params": { ... },
  "context": {
    "description": "<string>",
    "requesterName": "<string>",
    "urgency": "low" | "normal" | "high" | "critical",
    "estimatedRisk": "low" | "medium" | "high",
    ...
  }
}
```

- `capability`: identifies which capability to invoke (REQUIRED)
- `action`: identifies which action within the capability (REQUIRED)
- `params`: action-specific parameters, schema defined by the capability (REQUIRED, may be empty object)
- `context`: human-readable metadata to help the user decide (OPTIONAL)

#### Scenario: Valid authorization request

- **WHEN** the Requester sends an `authorize` request with a valid capability, action, and params
- **THEN** the Authorizer SHALL present the request to the user for approval and return the result

#### Scenario: Missing capability field

- **WHEN** an `authorize` request is missing the `capability` field
- **THEN** the Authorizer SHALL respond with `status: "error"` and `errorCode: "INVALID_PARAMS"`

#### Scenario: Missing action field

- **WHEN** an `authorize` request is missing the `action` field
- **THEN** the Authorizer SHALL respond with `status: "error"` and `errorCode: "INVALID_PARAMS"`

### Requirement: Three-state response model

All authorization responses SHALL include a `status` field with one of three values:

**Approved:**
```json
{
  "requestId": "<string>",
  "status": "approved",
  "result": { ... }
}
```

**Rejected (user deliberately declined):**
```json
{
  "requestId": "<string>",
  "status": "rejected",
  "reason": "<optional human-readable reason>"
}
```

**Error (system failure):**
```json
{
  "requestId": "<string>",
  "status": "error",
  "error": "<human-readable message>",
  "errorCode": "<standard error code>"
}
```

#### Scenario: User approves request

- **WHEN** the user approves an authorization request on the Authorizer device
- **THEN** the Authorizer SHALL respond with `status: "approved"` and the capability-specific `result` payload

#### Scenario: User rejects request

- **WHEN** the user explicitly rejects an authorization request
- **THEN** the Authorizer SHALL respond with `status: "rejected"` and an optional `reason`

#### Scenario: System error during authorization

- **WHEN** a system error occurs (e.g., Authorizer locked, capability failure)
- **THEN** the Authorizer SHALL respond with `status: "error"`, a human-readable `error` message, and a standard `errorCode`

### Requirement: Standard error codes

The protocol SHALL define the following standard error codes:

| Error Code | Description |
|---|---|
| `AUTHORIZER_LOCKED` | The Authorizer device is locked and cannot process requests |
| `SESSION_FROZEN` | The session has been frozen due to a security concern |
| `USER_REJECTED` | The user explicitly rejected the request |
| `APPROVAL_TIMEOUT` | The request timed out waiting for user approval |
| `CAPABILITY_NOT_FOUND` | The requested capability is not available on this Authorizer |
| `ACTION_NOT_SUPPORTED` | The requested action is not supported by the specified capability |
| `INVALID_PARAMS` | The request parameters are malformed or missing required fields |
| `POLICY_DENIED` | The request was automatically denied by the Authorizer's policy engine |
| `INTERNAL_ERROR` | An unexpected internal error occurred |

Implementations MAY define additional capability-specific error codes prefixed with the capability id (e.g., `EVM_SIGNER_INSUFFICIENT_BALANCE`).

#### Scenario: Capability not found

- **WHEN** a Requester sends an `authorize` request with a `capability` that the Authorizer does not support
- **THEN** the Authorizer SHALL respond with `status: "error"` and `errorCode: "CAPABILITY_NOT_FOUND"`

#### Scenario: Action not supported

- **WHEN** a Requester sends an `authorize` request with a valid `capability` but unsupported `action`
- **THEN** the Authorizer SHALL respond with `status: "error"` and `errorCode: "ACTION_NOT_SUPPORTED"`

#### Scenario: Policy auto-denial

- **WHEN** the Authorizer's policy engine automatically denies a request (e.g., exceeds daily limit)
- **THEN** the Authorizer SHALL respond with `status: "error"` and `errorCode: "POLICY_DENIED"`

### Requirement: Context metadata for human decision-making

The `context` field in authorization requests SHALL provide human-readable information to help the user make an informed decision. The following fields are defined:

- `description` (string): brief human-readable summary of what the action does
- `requesterName` (string): name of the requesting agent or service
- `urgency` (enum): `"low"`, `"normal"`, `"high"`, `"critical"`
- `estimatedRisk` (enum): `"low"`, `"medium"`, `"high"`

Capabilities MAY define additional context fields relevant to their domain (e.g., `estimatedUSD` for financial transactions).

The Authorizer SHALL display available context information to the user alongside the authorization request.

#### Scenario: Context displayed to user

- **WHEN** an authorization request includes `context.description` and `context.urgency`
- **THEN** the Authorizer SHALL present this information visually to the user before they approve or reject

#### Scenario: Missing context

- **WHEN** an authorization request omits the `context` field entirely
- **THEN** the Authorizer SHALL still present the request using capability and action metadata, without additional context

### Requirement: Protocol version negotiation

The `pair_complete` message and `capabilities` response SHALL include the protocol version string (e.g., `"open-auth/1.0"`). Implementations SHALL reject connections from incompatible major versions at pairing time.

#### Scenario: Compatible protocol versions

- **WHEN** a Requester using `open-auth/1.0` pairs with an Authorizer using `open-auth/1.0`
- **THEN** the pairing SHALL succeed

#### Scenario: Incompatible major version

- **WHEN** a Requester using `open-auth/2.0` attempts to pair with an Authorizer that only supports `open-auth/1.x`
- **THEN** the Authorizer SHALL reject the pairing with a version mismatch error
