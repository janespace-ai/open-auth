## ADDED Requirements

### Requirement: E2EE engine key pair generation test

The unit test suite SHALL verify that E2EEEngine.generateKeyPair produces valid X25519 key pairs.

#### Scenario: Key pair has correct sizes

- **WHEN** generateKeyPair is called
- **THEN** privateKey SHALL be 32 bytes and publicKey SHALL be 32 bytes

#### Scenario: Key pairs are unique

- **WHEN** generateKeyPair is called twice
- **THEN** the two private keys SHALL be different

### Requirement: E2EE session key symmetry test

The unit test suite SHALL verify that X25519 ECDH produces identical session keys for both parties.

#### Scenario: Symmetric key derivation

- **WHEN** Alice computes computeSessionKey(alicePriv, bobPub) and Bob computes computeSessionKey(bobPriv, alicePub)
- **THEN** both derived session keys SHALL be byte-identical

### Requirement: E2EE encrypt-decrypt round trip test

The unit test suite SHALL verify that encrypted messages decrypt to the original plaintext.

#### Scenario: Single message round trip

- **WHEN** a plaintext message is encrypted with a session and then decrypted with the same session key
- **THEN** the decrypted plaintext SHALL equal the original message

#### Scenario: Multi-message round trip

- **WHEN** 10 consecutive messages are encrypted and decrypted
- **THEN** all 10 decrypted plaintexts SHALL equal their originals and sequence numbers SHALL increment correctly

### Requirement: E2EE sequence counter test

The unit test suite SHALL verify that encrypt increments the send sequence counter.

#### Scenario: Sequence auto-increment

- **WHEN** encrypt is called 3 times on the same session
- **THEN** the returned seq values SHALL be 1, 2, 3

### Requirement: E2EE anti-replay protection test

The unit test suite SHALL verify that replay and out-of-window messages are rejected.

#### Scenario: Replay of same sequence number

- **WHEN** a message with the same sequence number as a previously received message is decrypted
- **THEN** the E2EE engine SHALL throw an error containing "replay"

#### Scenario: Sequence number regression

- **WHEN** a message with a sequence number lower than the highest received is decrypted
- **THEN** the E2EE engine SHALL throw an error containing "replay"

#### Scenario: Excessive sequence gap

- **WHEN** a message with sequence number more than 100 ahead of the highest received is decrypted
- **THEN** the E2EE engine SHALL throw an error containing "too far ahead"

### Requirement: E2EE payload validation test

The unit test suite SHALL verify that malformed payloads are rejected.

#### Scenario: Payload too short

- **WHEN** a payload shorter than 20 bytes (4-byte header + 16-byte auth tag) is decrypted
- **THEN** the E2EE engine SHALL throw an error containing "too short"

### Requirement: E2EE binary envelope format test

The unit test suite SHALL verify the binary envelope structure.

#### Scenario: Envelope starts with big-endian sequence number

- **WHEN** a message is encrypted with sequence number N
- **THEN** the base64-decoded envelope's first 4 bytes SHALL be the big-endian representation of N

### Requirement: E2EE session creation test

The unit test suite SHALL verify createSession initializes all counters to zero.

#### Scenario: Fresh session counters

- **WHEN** createSession is called
- **THEN** sendSeq, recvSeq, and highestRecvSeq SHALL all be 0

### Requirement: Capability registry CRUD test

The unit test suite SHALL verify capability registration and retrieval.

#### Scenario: Register and get

- **WHEN** a capability is registered and then retrieved by ID
- **THEN** the returned capability SHALL match the registered one

#### Scenario: Get all capabilities

- **WHEN** 2 capabilities are registered
- **THEN** getAll SHALL return both and getIds SHALL return both IDs

### Requirement: Capability routing test

The unit test suite SHALL verify that authorize requests are routed correctly.

#### Scenario: Route to unknown capability

- **WHEN** a request with an unregistered capability ID is routed
- **THEN** the response SHALL have status "error" and code "UNSUPPORTED_CAPABILITY"

#### Scenario: Route with invalid params

- **WHEN** a request fails handler validation
- **THEN** the response SHALL have status "error" and code "INVALID_PARAMS"

#### Scenario: Route with successful execution

- **WHEN** a request passes validation and handler executes successfully
- **THEN** the response SHALL have status "approved" with the handler's result

#### Scenario: Route with handler exception

- **WHEN** a handler throws an error during execution
- **THEN** the response SHALL have status "error" and code "EXECUTION_ERROR"

### Requirement: Display utility terminology mapping test

The unit test suite SHALL verify that internal identifiers map to app-store-safe display names.

#### Scenario: Known capability name

- **WHEN** getCapabilityDisplayName is called with "evm-signer"
- **THEN** the result SHALL be "Digital Signer"

#### Scenario: Unknown capability fallback

- **WHEN** getCapabilityDisplayName is called with an unregistered ID
- **THEN** the result SHALL be the raw ID string

#### Scenario: Known action name

- **WHEN** getActionDisplayName is called with "sign_transaction"
- **THEN** the result SHALL be "Sign Transaction"

#### Scenario: Chain ID mapping

- **WHEN** getChainName is called with 1
- **THEN** the result SHALL be "Ethereum Mainnet"

#### Scenario: Unknown chain fallback

- **WHEN** getChainName is called with 99999
- **THEN** the result SHALL be "Network #99999"

#### Scenario: Risk level display

- **WHEN** getRiskDisplay is called with "low"
- **THEN** the result SHALL contain label "Low Risk" and a green color

### Requirement: Address truncation test

The unit test suite SHALL verify address truncation behavior.

#### Scenario: Long address truncated

- **WHEN** truncateAddress is called with a 42-character address
- **THEN** the result SHALL show first 8 characters, "...", and last 6 characters

#### Scenario: Short address not truncated

- **WHEN** truncateAddress is called with a short string
- **THEN** the result SHALL be the original string unchanged

### Requirement: Timestamp formatting test

The unit test suite SHALL verify relative time formatting.

#### Scenario: Recent timestamp

- **WHEN** formatTimestamp is called with a timestamp 30 seconds ago
- **THEN** the result SHALL be "Just now"

#### Scenario: Minutes ago

- **WHEN** formatTimestamp is called with a timestamp 5 minutes ago
- **THEN** the result SHALL be "5m ago"

#### Scenario: Hours ago

- **WHEN** formatTimestamp is called with a timestamp 3 hours ago
- **THEN** the result SHALL be "3h ago"

#### Scenario: Days ago

- **WHEN** formatTimestamp is called with a timestamp 2 days ago
- **THEN** the result SHALL be "2d ago"

### Requirement: Date grouping test

The unit test suite SHALL verify groupByDate produces correct sections.

#### Scenario: Items grouped by Today, Yesterday, and date

- **WHEN** groupByDate is called with items spanning 3 days
- **THEN** the result SHALL contain sections titled "Today", "Yesterday", and a formatted date string

### Requirement: Zustand store CRUD test

The unit test suite SHALL verify all 4 Zustand stores.

#### Scenario: Auth store state transitions

- **WHEN** setOnboarded, setLocked, setDemoMode, setPinHash, and setBiometricEnabled are called
- **THEN** each corresponding state field SHALL update correctly

#### Scenario: Auth store reset

- **WHEN** reset is called
- **THEN** all fields SHALL return to initial values

#### Scenario: Agents store CRUD

- **WHEN** addAgent, updateAgent, removeAgent, and getAgent are called
- **THEN** the agents list SHALL reflect each operation correctly

#### Scenario: Requests store lifecycle

- **WHEN** addRequest, getRequest, removeRequest, and clearAll are called
- **THEN** the pending list SHALL reflect each operation correctly

#### Scenario: History store operations

- **WHEN** addRecord, setRecords, and getByAgent are called
- **THEN** records SHALL be stored in reverse chronological order and filtered correctly by agent

### Requirement: Mock services conformance test

The unit test suite SHALL verify all mock services implement their interfaces correctly.

#### Scenario: MockRelayService connect sets connected

- **WHEN** MockRelayService.connect is called
- **THEN** getStatus SHALL return "connected"

#### Scenario: MockKeyManager returns fixed data

- **WHEN** MockKeyManager.hasWallet and getAddress are called
- **THEN** hasWallet SHALL return true and getAddress SHALL return a fixed Ethereum address

#### Scenario: MockSigningEngine returns mock signatures

- **WHEN** MockSigningEngine.signTransaction is called
- **THEN** the result SHALL contain a signature string and an address

#### Scenario: MockCapabilityRegistry routes always approve

- **WHEN** MockCapabilityRegistry.route is called with any request
- **THEN** the response status SHALL be "approved"

### Requirement: Demo scheduler timing test

The unit test suite SHALL verify the demo request scheduler timing and limits using fake timers.

#### Scenario: First request after 30 seconds

- **WHEN** start is called, then onRequestHandled is called, and 30 seconds elapse
- **THEN** the callback SHALL be invoked with the first scheduled request

#### Scenario: Second request after 90 seconds

- **WHEN** onRequestHandled is called a second time and 90 seconds elapse
- **THEN** the callback SHALL be invoked with the second scheduled request

#### Scenario: No more requests after maximum

- **WHEN** onRequestHandled is called a third time
- **THEN** no further callback SHALL be invoked regardless of time elapsed

#### Scenario: Stop clears pending timers

- **WHEN** stop is called after onRequestHandled but before timer fires
- **THEN** the callback SHALL NOT be invoked
