## ADDED Requirements

### Requirement: Message envelope types

The protocol SHALL define exactly three transport-level message types, identified by the `type` field:
- `"pair_complete"`: sent during pairing (plaintext)
- `"handshake"`: sent during session re-establishment (plaintext)
- `"encrypted"`: wraps all post-pairing application messages (E2EE)

#### Scenario: Message type identification

- **WHEN** a message is received at the transport layer
- **THEN** the receiver SHALL inspect the `type` field and route to the appropriate handler (pairing, handshake, or decryption)

#### Scenario: Unknown message type

- **WHEN** a message is received with an unrecognized `type` value
- **THEN** the receiver SHALL silently discard the message

### Requirement: pair_complete message format

The `pair_complete` message SHALL have the following structure:

```json
{
  "type": "pair_complete",
  "agentPublicKey": "<hex>",
  "machineId": "<hex>",
  "protocol": "open-auth/1.0",
  "authorizerId": "<string>",
  "deviceType": "<string>",
  "deviceName": "<string>"
}
```

All fields except `deviceName` are REQUIRED.

#### Scenario: Valid pair_complete

- **WHEN** a `pair_complete` message is received with all required fields
- **THEN** the receiver SHALL process the pairing and store the device metadata

#### Scenario: Missing required field

- **WHEN** a `pair_complete` message is missing a required field
- **THEN** the receiver SHALL reject the pairing attempt

### Requirement: handshake message format

The `handshake` message SHALL be used for session re-establishment after disconnection. The Requester-initiated handshake SHALL include:

```json
{
  "type": "handshake",
  "publicKey": "<hex>",
  "machineId": "<hex>",
  "reconnect": true
}
```

The Authorizer response SHALL include:

```json
{
  "type": "handshake",
  "publicKey": "<hex>"
}
```

#### Scenario: Successful reconnection handshake

- **WHEN** a Requester sends a handshake with `reconnect: true` and matching stored public key and machineId
- **THEN** the Authorizer SHALL respond with its public key and resume the E2EE session

#### Scenario: Public key mismatch on reconnect

- **WHEN** a handshake is received with a public key that does not match stored pairing data
- **THEN** the Authorizer SHALL reject the handshake and require re-pairing

### Requirement: encrypted message format

The `encrypted` message SHALL wrap all post-pairing application-level communication:

```json
{
  "type": "encrypted",
  "payload": "<base64>"
}
```

Response messages SHALL additionally include a `requestId` at the top level for relay routing:

```json
{
  "type": "encrypted",
  "payload": "<base64>",
  "requestId": "<string>"
}
```

The `payload` field contains the base64-encoded E2EE binary envelope (defined in e2ee-protocol spec).

#### Scenario: Encrypted application message

- **WHEN** a party needs to send an application-level message after pairing
- **THEN** the party SHALL encrypt the JSON plaintext, encode as base64, and wrap in an `encrypted` envelope

#### Scenario: Response includes requestId for routing

- **WHEN** the Authorizer sends a response to an authorization request
- **THEN** the `requestId` SHALL be included at the top level of the encrypted message (outside the E2EE payload) for relay routing

### Requirement: requestId-based correlation

Every request message SHALL include a `requestId` field (inside the E2EE plaintext). Response messages SHALL echo the same `requestId`. The relay uses `requestId` at the transport level to route responses back to the originating HTTP request.

#### Scenario: Request-response correlation

- **WHEN** a Requester sends a request with `requestId: "req-abc"`
- **THEN** the Authorizer's response SHALL include `requestId: "req-abc"` both inside the E2EE plaintext and at the top level of the encrypted envelope

### Requirement: Transport agnosticism

The protocol SHALL NOT depend on any specific transport mechanism. The message envelopes (pair_complete, handshake, encrypted) SHALL be serializable as JSON and transmittable over any bidirectional channel including but not limited to: HTTP relay, WebSocket, Bluetooth, local IPC.

#### Scenario: Same protocol over different transports

- **WHEN** an implementation uses HTTP relay as transport
- **THEN** the application-layer messages SHALL be identical to those sent over WebSocket or any other transport
