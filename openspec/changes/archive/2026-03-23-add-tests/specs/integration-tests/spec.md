## ADDED Requirements

### Requirement: E2EE duplex communication test

The integration test suite SHALL verify that two independent E2EE sessions can communicate bidirectionally using real cryptographic primitives.

#### Scenario: Both parties derive identical session keys

- **WHEN** Alice creates a session with (alicePriv, alicePub, bobPub) and Bob creates a session with (bobPriv, bobPub, alicePub)
- **THEN** Alice's sessionKey SHALL be byte-identical to Bob's sessionKey

#### Scenario: Alice-to-Bob message delivery

- **WHEN** Alice encrypts a message and Bob decrypts the resulting payload
- **THEN** Bob SHALL recover the original plaintext

#### Scenario: Bob-to-Alice message delivery

- **WHEN** Bob encrypts a message and Alice decrypts the resulting payload
- **THEN** Alice SHALL recover the original plaintext

#### Scenario: Multi-message bidirectional exchange

- **WHEN** 10 messages are sent alternating between Alice and Bob
- **THEN** all messages SHALL decrypt correctly on the receiving side with correct sequence numbers

#### Scenario: Cross-session isolation

- **WHEN** Alice encrypts a message for Bob using session 1, and Carol attempts to decrypt it using a different session
- **THEN** the decryption SHALL fail with an authentication error

### Requirement: ServiceContainer mode switching test

The integration test suite SHALL verify that ServiceContainer correctly initializes with real or mock services.

#### Scenario: Real mode initialization

- **WHEN** initializeServices is called with demoMode=false
- **THEN** ServiceContainer.isDemoMode SHALL be false and all service getters SHALL return non-mock instances

#### Scenario: Demo mode initialization

- **WHEN** initializeServices is called with demoMode=true
- **THEN** ServiceContainer.isDemoMode SHALL be true and all service getters SHALL return mock instances

#### Scenario: Mode switch idempotency

- **WHEN** initializeServices is called twice with different modes
- **THEN** the second call SHALL override the first and all services SHALL reflect the new mode

### Requirement: Capability-to-signing chain test

The integration test suite SHALL verify the end-to-end flow from capability routing to signing engine execution.

#### Scenario: Generic approval route returns approved

- **WHEN** a CapabilityRegistry is configured with a generic-approval handler and a valid approve request is routed
- **THEN** the response SHALL have status "approved"

#### Scenario: Handler validation rejection propagates

- **WHEN** a capability handler's validate method returns invalid and a request is routed
- **THEN** the response SHALL have status "error" with code "INVALID_PARAMS" and the signing engine SHALL NOT be invoked
