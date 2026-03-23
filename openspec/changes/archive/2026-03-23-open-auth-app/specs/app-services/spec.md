## ADDED Requirements

### Requirement: Relay connection establishment

The Relay Connection Service SHALL manage a WebSocket connection to the relay server. The service SHALL connect using the stored `pairId` to identify the session. The WebSocket SHALL operate in foreground-only mode — no background persistence.

#### Scenario: Connect to relay

- **WHEN** the app needs to communicate with a paired Requester
- **THEN** the service SHALL open a WebSocket connection to the relay server, authenticating with the stored `pairId`

#### Scenario: Foreground-only lifecycle

- **WHEN** the app transitions to the background
- **THEN** the service SHALL gracefully close the WebSocket connection

#### Scenario: Re-establish on foreground

- **WHEN** the app transitions to the foreground and a pairing exists
- **THEN** the service SHALL re-establish the WebSocket connection to the relay server

### Requirement: Relay auto-reconnect with exponential backoff

The Relay Connection Service SHALL automatically reconnect when the WebSocket disconnects unexpectedly. Reconnect attempts SHALL use exponential backoff starting at 1 second and capping at 30 seconds.

#### Scenario: Unexpected disconnect

- **WHEN** the WebSocket connection drops while the app is in the foreground
- **THEN** the service SHALL attempt to reconnect with exponential backoff (1s, 2s, 4s, 8s, 16s, 30s cap)

#### Scenario: Successful reconnect resets backoff

- **WHEN** a reconnection attempt succeeds
- **THEN** the backoff delay SHALL reset to the initial 1-second interval

### Requirement: Relay heartbeat

The Relay Connection Service SHALL send a heartbeat ping every 30 seconds to keep the WebSocket connection alive.

#### Scenario: Heartbeat interval

- **WHEN** the WebSocket connection is open and idle
- **THEN** the service SHALL send a ping frame every 30 seconds

#### Scenario: Heartbeat failure

- **WHEN** a heartbeat ping does not receive a pong within 10 seconds
- **THEN** the service SHALL treat the connection as dead and trigger the reconnect flow

### Requirement: Relay message routing

The Relay Connection Service SHALL send encrypted messages via the WebSocket and route received encrypted messages to the E2EE Engine for decryption.

#### Scenario: Send encrypted message

- **WHEN** the app needs to send a response to the Requester
- **THEN** the service SHALL pass the plaintext to the E2EE Engine for encryption and transmit the resulting encrypted envelope over the WebSocket

#### Scenario: Receive encrypted message

- **WHEN** an encrypted message arrives on the WebSocket
- **THEN** the service SHALL pass the message to the E2EE Engine for decryption and route the resulting plaintext to the appropriate handler

#### Scenario: Peer disconnected notification

- **WHEN** a `peer_disconnected` notification is received from the relay
- **THEN** the service SHALL update connection status to reflect that the peer is offline and stop attempting to send messages until the peer reconnects

### Requirement: E2EE key pair generation

The E2EE Engine SHALL generate X25519 key pairs for Elliptic Curve Diffie-Hellman key exchange, reusing the crypto patterns established in claw-wallet.

#### Scenario: Generate communication key pair

- **WHEN** a new pairing session is initiated
- **THEN** the E2EE Engine SHALL generate a fresh X25519 key pair and make the public key available for exchange

### Requirement: E2EE shared secret computation

The E2EE Engine SHALL compute a shared secret using X25519 ECDH with the local private key and the remote party's public key.

#### Scenario: Derive shared secret

- **WHEN** both parties have exchanged X25519 public keys
- **THEN** the E2EE Engine SHALL compute `X25519(localPrivateKey, remotePublicKey)` to produce the shared secret

### Requirement: E2EE session key derivation

The E2EE Engine SHALL derive the session encryption key using HKDF-SHA256 with:
- **IKM**: the X25519 shared secret
- **Salt**: empty (no salt)
- **Info**: the UTF-8 bytes of `"open-auth-e2ee-v1"`
- **Output length**: 32 bytes

#### Scenario: Deterministic key derivation

- **WHEN** both parties share the same X25519 shared secret
- **THEN** HKDF-SHA256 with info `"open-auth-e2ee-v1"` SHALL produce the identical 32-byte AES-256-GCM encryption key on both sides

### Requirement: E2EE AES-256-GCM encrypt/decrypt

The E2EE Engine SHALL encrypt all outgoing messages and decrypt all incoming messages using AES-256-GCM with the HKDF-derived 32-byte session key.

#### Scenario: Encrypt outgoing message

- **WHEN** a plaintext JSON message needs to be sent
- **THEN** the E2EE Engine SHALL serialize to UTF-8 bytes and encrypt with AES-256-GCM using the session key and a sequence-derived nonce

#### Scenario: Decrypt incoming message

- **WHEN** an encrypted payload is received
- **THEN** the E2EE Engine SHALL extract the sequence number from the binary envelope, reconstruct the nonce, and decrypt with AES-256-GCM

### Requirement: E2EE sequence-based nonce construction

The 12-byte GCM nonce SHALL be constructed by placing the 4-byte big-endian sequence number at byte positions 4 through 7 (0-indexed), with all other bytes set to zero. The E2EE Engine SHALL maintain independent send and receive sequence counters, each starting at 0.

#### Scenario: Nonce from sequence number

- **WHEN** a message is sent or received with sequence number `N`
- **THEN** the nonce SHALL be `[0x00, 0x00, 0x00, 0x00, (N >> 24) & 0xFF, (N >> 16) & 0xFF, (N >> 8) & 0xFF, N & 0xFF, 0x00, 0x00, 0x00, 0x00]`

#### Scenario: Independent counters

- **WHEN** the E2EE Engine sends and receives messages concurrently
- **THEN** the send sequence counter and receive sequence counter SHALL increment independently

### Requirement: E2EE binary envelope format

The binary envelope SHALL be: `[4-byte sequence number (big-endian)][AES-GCM ciphertext + 16-byte authentication tag]`. The binary envelope SHALL be base64-encoded for JSON transport.

#### Scenario: Envelope construction

- **WHEN** a message is encrypted with sequence number 42
- **THEN** the binary envelope SHALL be `[0x00, 0x00, 0x00, 0x2A][ciphertext + auth_tag]` and the base64 encoding SHALL be placed in the `payload` field

### Requirement: E2EE anti-replay protection

The E2EE Engine SHALL maintain the highest received sequence number and reject any message with a sequence number that is:
- Less than or equal to the highest previously received sequence number (replay)
- More than 100 greater than the highest previously received sequence number (excessive gap)

#### Scenario: Replay rejection

- **WHEN** a message is received with a sequence number equal to or less than the highest received
- **THEN** the E2EE Engine SHALL silently discard the message

#### Scenario: Excessive gap rejection

- **WHEN** a message is received with a sequence number more than 100 greater than the highest received
- **THEN** the E2EE Engine SHALL silently discard the message

#### Scenario: Valid sequence progression

- **WHEN** messages arrive with strictly increasing sequence numbers within the gap tolerance
- **THEN** the E2EE Engine SHALL accept and process each message

### Requirement: BIP-39 mnemonic generation

The Key Manager SHALL generate a BIP-39 mnemonic phrase using 128-bit entropy, producing a 12-word recovery phrase.

#### Scenario: Generate new wallet

- **WHEN** the user creates a new wallet in the app
- **THEN** the Key Manager SHALL generate a cryptographically random 128-bit entropy value and derive a 12-word BIP-39 mnemonic

#### Scenario: Import existing mnemonic

- **WHEN** the user provides an existing 12-word mnemonic
- **THEN** the Key Manager SHALL validate the checksum and import the mnemonic for key derivation

### Requirement: HD key derivation

The Key Manager SHALL derive wallet keys using the BIP-44 hierarchical deterministic path `m/44'/60'/0'/0/0`.

#### Scenario: Derive EVM account

- **WHEN** a mnemonic is available (generated or imported)
- **THEN** the Key Manager SHALL derive the private key and address at path `m/44'/60'/0'/0/0`

### Requirement: Private key encryption at rest

The Key Manager SHALL encrypt the private key using AES-256-GCM with a key derived from the user's PIN via scrypt with parameters N=16384, r=8, p=1. The encrypted keystore SHALL be stored in `expo-secure-store`.

#### Scenario: Store encrypted private key

- **WHEN** a wallet is created or imported
- **THEN** the Key Manager SHALL derive an encryption key from the user's PIN via scrypt (N=16384, r=8, p=1), encrypt the private key with AES-256-GCM, and store the ciphertext in `expo-secure-store`

#### Scenario: Decrypt private key on demand

- **WHEN** a signing operation requires the private key
- **THEN** the Key Manager SHALL require the user's PIN or biometric authentication, derive the decryption key via scrypt, and decrypt the private key from `expo-secure-store`

### Requirement: Key material zeroing

The Key Manager SHALL zero all sensitive key material from memory immediately after use. Private keys, mnemonics, and shared secrets MUST NOT persist in memory longer than the operation that requires them.

#### Scenario: Zero after key derivation

- **WHEN** the HD derivation produces a private key and the key has been encrypted for storage
- **THEN** the Key Manager SHALL overwrite the plaintext private key and mnemonic bytes with zeros

#### Scenario: Zero after signing

- **WHEN** a decrypted private key has been used for a signing operation
- **THEN** the Key Manager SHALL overwrite the plaintext private key bytes with zeros immediately after signing completes

### Requirement: X25519 communication key pair management

The Key Manager SHALL generate and store X25519 key pairs used for E2EE communication. These keys SHALL be separate from the wallet HD keys.

#### Scenario: Generate communication key pair

- **WHEN** the app initiates a new pairing
- **THEN** the Key Manager SHALL generate a fresh X25519 key pair and store it securely in `expo-secure-store`, independent of the wallet key material

#### Scenario: Retrieve communication key pair

- **WHEN** the E2EE Engine needs the X25519 private key for shared secret computation
- **THEN** the Key Manager SHALL provide the key and the E2EE Engine SHALL zero the private key material after deriving the shared secret

### Requirement: EVM transaction signing

The Signing Engine SHALL sign EVM transactions using viem's `privateKeyToAccount`. The private key SHALL be retrieved from the Key Manager (requiring unlock) and zeroed immediately after signing.

#### Scenario: Sign transaction

- **WHEN** an authorized transaction signing request is received
- **THEN** the Signing Engine SHALL retrieve the private key from the Key Manager, create a viem account via `privateKeyToAccount`, sign the transaction, zero the private key, and return the signed transaction along with the signer address

### Requirement: Personal message signing (EIP-191)

The Signing Engine SHALL sign personal messages per EIP-191.

#### Scenario: Sign personal message

- **WHEN** an authorized personal_sign request is received
- **THEN** the Signing Engine SHALL retrieve the private key, sign the message per EIP-191, zero the private key, and return the signature along with the signer address

### Requirement: Typed data signing (EIP-712)

The Signing Engine SHALL sign typed structured data per EIP-712.

#### Scenario: Sign typed data

- **WHEN** an authorized signTypedData request is received
- **THEN** the Signing Engine SHALL retrieve the private key, sign the typed data per EIP-712, zero the private key, and return the signature along with the signer address

### Requirement: Signing Engine key lifecycle

The Signing Engine MUST NOT hold the private key beyond the duration of a single signing operation. The private key SHALL be retrieved, used, and zeroed within a single synchronous-equivalent scope.

#### Scenario: Key retrieval requires unlock

- **WHEN** the Signing Engine initiates a signing operation
- **THEN** the Key Manager SHALL require PIN or biometric unlock before releasing the private key

#### Scenario: Immediate key zeroing

- **WHEN** a signing operation completes (success or failure)
- **THEN** the Signing Engine SHALL zero the private key bytes before returning the result

### Requirement: Capability registration at startup

The Capability Registry SHALL register all built-in capabilities when the app starts. Each capability SHALL have a unique identifier and an associated handler.

#### Scenario: Register built-in capabilities

- **WHEN** the app launches
- **THEN** the Capability Registry SHALL register at minimum `evm-signer` and `generic-approval` capabilities with their respective handlers

### Requirement: Capability request routing

The Capability Registry SHALL route incoming `authorize` requests to the correct capability handler based on the `capability` field in the request.

#### Scenario: Route to evm-signer

- **WHEN** an authorize request is received with `capability: "evm-signer"`
- **THEN** the Capability Registry SHALL route the request to the evm-signer handler

#### Scenario: Route to generic-approval

- **WHEN** an authorize request is received with `capability: "generic-approval"`
- **THEN** the Capability Registry SHALL route the request to the generic-approval handler

#### Scenario: Unknown capability

- **WHEN** an authorize request is received with an unregistered capability identifier
- **THEN** the Capability Registry SHALL respond with an error indicating the capability is not supported

### Requirement: evm-signer capability handler

The evm-signer handler SHALL validate the request parameters, invoke the Signing Engine, and format the result for response.

#### Scenario: Valid signing request

- **WHEN** the evm-signer handler receives a request with valid transaction or message parameters
- **THEN** the handler SHALL validate the parameters, present the request to the user for approval, invoke the Signing Engine upon approval, and return the signed result

#### Scenario: Invalid parameters

- **WHEN** the evm-signer handler receives a request with missing or malformed parameters
- **THEN** the handler SHALL reject the request with a descriptive error without invoking the Signing Engine

### Requirement: generic-approval capability handler

The generic-approval handler SHALL present the request to the user and return an approval decision with a one-time token.

#### Scenario: User approves

- **WHEN** the user approves a generic-approval request
- **THEN** the handler SHALL return `approved: true` along with a one-time token

#### Scenario: User rejects

- **WHEN** the user rejects a generic-approval request
- **THEN** the handler SHALL return `approved: false` with no token

### Requirement: Capabilities query response

The Capability Registry SHALL respond to capabilities queries with the list of all registered capabilities.

#### Scenario: Query capabilities

- **WHEN** a `capabilities` query is received from a paired Requester
- **THEN** the Capability Registry SHALL return an array of registered capability identifiers (e.g., `["evm-signer", "generic-approval"]`)

### Requirement: Push notification registration

The Notification Service SHALL register for push notifications using FCM on Android and APNs on iOS. The device push token SHALL be sent to the relay server and associated with the current `pairId`.

#### Scenario: Register push token on Android

- **WHEN** the app starts on an Android device with an active pairing
- **THEN** the Notification Service SHALL obtain a FCM token and send it to the relay server associated with the `pairId`

#### Scenario: Register push token on iOS

- **WHEN** the app starts on an iOS device with an active pairing
- **THEN** the Notification Service SHALL obtain an APNs token and send it to the relay server associated with the `pairId`

### Requirement: Background notification display

The Notification Service SHALL display a generic alert when a push notification is received while the app is in the background. The push payload MUST NOT contain sensitive data.

#### Scenario: Background notification received

- **WHEN** a push notification arrives while the app is in the background
- **THEN** the Notification Service SHALL display a generic alert with the text "New authorization request" without revealing request details

#### Scenario: No sensitive data in payload

- **WHEN** the relay server sends a push notification
- **THEN** the push payload MUST contain only a generic alert and the `pairId` — no request content, addresses, or amounts

### Requirement: Notification tap handling

The Notification Service SHALL handle notification taps by opening the app, establishing the WebSocket connection, and fetching any pending request.

#### Scenario: User taps notification

- **WHEN** the user taps a push notification
- **THEN** the app SHALL open, the Relay Connection Service SHALL establish the WebSocket connection, and the app SHALL fetch and display the pending authorization request
