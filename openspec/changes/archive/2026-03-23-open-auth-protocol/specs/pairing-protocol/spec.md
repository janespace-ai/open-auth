## ADDED Requirements

### Requirement: Short-code pairing initiation

The Authorizer SHALL create a pairing session by generating an X25519 key pair and registering with a relay server. The relay server SHALL return an 8-character alphanumeric short code (charset: A-Z excluding I,O + digits 2-9) with a configurable TTL (default: 10 minutes).

The registration request SHALL include:
- `authorizerId`: a stable identifier for the Authorizer (e.g., wallet address, user ID)
- `publicKey`: the Authorizer's X25519 public key (hex-encoded)

#### Scenario: Authorizer creates pairing code

- **WHEN** the Authorizer sends a pairing registration with `authorizerId` and `publicKey`
- **THEN** the relay SHALL return a `shortCode` (8 characters) and `expiresIn` (seconds)

#### Scenario: Pairing code expires

- **WHEN** the TTL elapses without a Requester resolving the short code
- **THEN** the relay SHALL delete the pairing data and subsequent resolution attempts SHALL return "not found or expired"

### Requirement: Short-code resolution

The Requester SHALL resolve a short code to obtain the Authorizer's `authorizerId` and `publicKey`. Short code resolution SHALL be case-insensitive.

#### Scenario: Requester resolves valid code

- **WHEN** the Requester sends a resolution request with a valid, non-expired short code
- **THEN** the relay SHALL return the Authorizer's `authorizerId` and `publicKey`

#### Scenario: Requester resolves invalid or expired code

- **WHEN** the Requester sends a resolution request with an invalid or expired short code
- **THEN** the relay SHALL return a "not found or expired" error

### Requirement: QR code pairing

The Authorizer SHALL support encoding the short code (and optionally relay URL) into a QR code as an alternative to manual code entry. The QR payload SHALL use the URI format: `openauth://pair?code=<shortCode>&relay=<relayUrl>`.

#### Scenario: Requester scans QR code

- **WHEN** the Requester scans an open-auth QR code
- **THEN** the Requester SHALL extract the `code` and `relay` parameters and proceed with short-code resolution

### Requirement: X25519 key exchange during pairing

Upon resolving the short code, the Requester SHALL generate its own X25519 key pair and send a `pair_complete` message to the Authorizer containing the Requester's public key and device identity.

The `pair_complete` message SHALL include:
- `type`: `"pair_complete"`
- `agentPublicKey`: Requester's X25519 public key (hex-encoded)
- `machineId`: Requester's device fingerprint (SHA256 of hostname + MAC address, first 16 hex chars)
- `protocol`: protocol identifier (e.g., `"open-auth/1.0"`)
- `authorizerId`: the resolved Authorizer identifier
- `deviceType`: Requester's device type (`"agent"`, `"service"`, `"cli"`)
- `deviceName`: human-readable Requester device name

#### Scenario: Successful key exchange

- **WHEN** the Requester sends a valid `pair_complete` message
- **THEN** both parties SHALL derive the shared secret using X25519 ECDH and store the pairing data persistently

#### Scenario: pair_complete with protocol metadata

- **WHEN** the Authorizer receives a `pair_complete` message
- **THEN** the Authorizer SHALL verify the `protocol` field is a supported version and store the Requester's device metadata

### Requirement: pairId derivation

The pairId SHALL be deterministically derived as: `sha256(authorizerCommPub + ":" + requesterCommPub)` truncated to the first 16 hex characters, where `authorizerCommPub` and `requesterCommPub` are the hex-encoded X25519 public keys.

#### Scenario: Both parties derive same pairId

- **WHEN** both Authorizer and Requester have exchanged public keys
- **THEN** both parties SHALL independently derive the identical pairId using the deterministic formula

#### Scenario: Different comm keys produce different pairIds

- **WHEN** the same Authorizer identity (e.g., same wallet address) is paired from two different devices with different X25519 key pairs
- **THEN** each pairing SHALL produce a distinct pairId

### Requirement: Persistent pairing storage

Both parties SHALL persist pairing data to disk after successful pairing. Stored data SHALL include: pairId, remote party's public key, remote party's machineId, authorizerId, protocol version, and device metadata.

#### Scenario: Reconnection after restart

- **WHEN** either party restarts and has persisted pairing data
- **THEN** the party SHALL be able to re-establish the E2EE session without re-pairing
