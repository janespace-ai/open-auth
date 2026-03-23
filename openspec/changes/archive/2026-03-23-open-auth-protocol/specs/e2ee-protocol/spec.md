## ADDED Requirements

### Requirement: X25519 ECDH shared secret derivation

Both parties SHALL derive a shared secret using X25519 Elliptic Curve Diffie-Hellman with their private key and the remote party's public key. The raw shared secret SHALL be fed into HKDF for key derivation.

#### Scenario: Shared secret agreement

- **WHEN** both parties have exchanged X25519 public keys during pairing
- **THEN** both parties SHALL independently compute the identical shared secret: `X25519(localPrivateKey, remotePublicKey)`

### Requirement: HKDF-SHA256 key derivation

The session encryption key SHALL be derived using HKDF-SHA256 with the following parameters:
- **IKM (Input Key Material)**: the X25519 shared secret
- **Salt**: empty (no salt)
- **Info**: the UTF-8 bytes of `"open-auth-e2ee-v1"`
- **Output length**: 32 bytes

The resulting 32-byte key SHALL be used as the AES-256-GCM encryption key.

#### Scenario: Deterministic key derivation

- **WHEN** both parties have the same shared secret
- **THEN** HKDF-SHA256 with info `"open-auth-e2ee-v1"` SHALL produce the identical 32-byte encryption key on both sides

#### Scenario: Protocol isolation from claw-wallet

- **WHEN** the same X25519 key pair is used with both claw-wallet (info: `"claw-wallet-e2ee-v1"`) and open-auth (info: `"open-auth-e2ee-v1"`)
- **THEN** the derived encryption keys SHALL differ, preventing cross-protocol decryption

### Requirement: AES-256-GCM encryption

All application-level messages SHALL be encrypted using AES-256-GCM with the HKDF-derived 32-byte key. The nonce SHALL be 12 bytes, derived from a monotonically increasing sequence number.

#### Scenario: Message encryption

- **WHEN** a party encrypts an application-level JSON message
- **THEN** the party SHALL serialize the JSON to UTF-8 bytes and encrypt with AES-256-GCM using the session key and sequence-derived nonce

#### Scenario: Message decryption

- **WHEN** a party receives an encrypted payload
- **THEN** the party SHALL decrypt using AES-256-GCM with the session key and reconstruct the nonce from the sequence number in the binary envelope

### Requirement: Sequence-based nonce construction

The 12-byte GCM nonce SHALL be constructed by placing the 4-byte big-endian sequence number at byte positions 4 through 7 (0-indexed), with all other bytes set to zero.

Each party SHALL maintain a monotonically increasing send sequence counter starting at 0.

#### Scenario: Nonce from sequence number

- **WHEN** a message is sent with sequence number `N`
- **THEN** the nonce SHALL be `[0x00, 0x00, 0x00, 0x00, (N >> 24) & 0xFF, (N >> 16) & 0xFF, (N >> 8) & 0xFF, N & 0xFF, 0x00, 0x00, 0x00, 0x00]`

### Requirement: Binary envelope format

The E2EE binary envelope SHALL be: `[4-byte sequence number (big-endian)] [AES-GCM ciphertext + 16-byte authentication tag]`.

The binary envelope SHALL be base64-encoded for JSON transport.

#### Scenario: Envelope construction

- **WHEN** a message is encrypted with sequence number 42
- **THEN** the binary envelope SHALL be `[0x00, 0x00, 0x00, 0x2A] [ciphertext + auth_tag]` and the base64 encoding of this SHALL be placed in the `payload` field

### Requirement: Anti-replay protection

The receiver SHALL maintain a record of the highest received sequence number. The receiver SHALL reject any message with a sequence number that is:
- Less than or equal to the highest previously received sequence number (replay)
- More than 100 greater than the highest previously received sequence number (excessive gap)

#### Scenario: Replay rejection

- **WHEN** a message is received with a sequence number equal to or less than a previously received sequence number
- **THEN** the receiver SHALL silently discard the message

#### Scenario: Excessive gap rejection

- **WHEN** a message is received with a sequence number more than 100 greater than the last received
- **THEN** the receiver SHALL silently discard the message

#### Scenario: Valid sequence progression

- **WHEN** messages arrive with strictly increasing sequence numbers within the gap tolerance
- **THEN** the receiver SHALL accept and process each message

### Requirement: Three-level reconnection verification

When a Requester reconnects (handshake with `reconnect: true`), the Authorizer SHALL perform three levels of verification:

**Level 1 (Hard — public key match):** The Requester's public key MUST match the stored public key from original pairing. Mismatch SHALL cause immediate rejection and require re-pairing.

**Level 2 (Hard — machineId match):** The Requester's machineId MUST match the stored machineId. Mismatch SHALL freeze the session (no requests processed until re-pairing).

**Level 3 (Configurable — IP policy):** The Authorizer SHALL support three IP change policies:
- `block`: reject connections from new IPs
- `warn` (default): allow if same subnet, flag if different subnet
- `allow`: no IP restrictions

#### Scenario: Level 1 — public key mismatch

- **WHEN** a reconnecting Requester presents a public key that does not match stored pairing data
- **THEN** the Authorizer SHALL reject the handshake and require a new pairing

#### Scenario: Level 2 — machineId mismatch

- **WHEN** a reconnecting Requester presents a mismatched machineId but correct public key
- **THEN** the Authorizer SHALL freeze the session and notify the user of a potential security issue

#### Scenario: Level 3 — IP change with warn policy

- **WHEN** a reconnecting Requester connects from a different IP with the default `warn` policy
- **THEN** the Authorizer SHALL allow the connection if the IP is in the same subnet, and flag the connection for user review if in a different subnet

### Requirement: Key material zeroing

Implementations SHALL zero all private key material and shared secrets from memory immediately after use (after deriving the session key). Private keys SHALL NOT be held in memory longer than necessary.

#### Scenario: Private key cleanup

- **WHEN** the session key has been derived from the X25519 shared secret
- **THEN** the implementation SHALL overwrite the raw shared secret bytes with zeros before releasing the memory
