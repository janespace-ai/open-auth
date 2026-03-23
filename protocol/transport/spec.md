# Transport Specification

**Open-Auth Protocol — Layer 1**
**Version:** 1.0 (Draft)
**Status:** Normative

---

## Table of Contents

1. [Overview](#1-overview)
2. [Conformance](#2-conformance)
3. [Message Types](#3-message-types)
4. [`pair_complete` Message Format](#4-pair_complete-message-format)
5. [`handshake` Message Format](#5-handshake-message-format)
6. [`encrypted` Message Format](#6-encrypted-message-format)
7. [`requestId` Correlation](#7-requestid-correlation)
8. [Transport Agnosticism](#8-transport-agnosticism)

---

## 1. Overview

This document defines Layer 1 of the Open-Auth protocol stack: the **Transport** layer.

The Transport layer specifies three message envelope types that carry all communication between a Requester and an Authorizer. These envelopes are **transport-agnostic** — they define structure and semantics, not delivery mechanism. Any bidirectional channel capable of transmitting JSON-encoded text messages MAY serve as a transport.

The three envelope types correspond to the protocol lifecycle:

| Envelope Type    | Lifecycle Phase         | Encryption |
|------------------|------------------------|------------|
| `pair_complete`  | Pairing completion      | Plaintext  |
| `handshake`      | Session re-establishment| Plaintext  |
| `encrypted`      | Application messaging   | E2EE       |

All messages defined in this specification are JSON objects. The `type` field discriminates between envelope types.

### Relationship to Other Layers

- **Layer 0 (Pairing):** Produces the shared secret and public keys transmitted in `pair_complete`.
- **Layer 2 (Security):** Defines the E2EE binary envelope carried inside `encrypted` payloads.
- **Layer 3 (Application):** Defines the plaintext JSON structures encrypted within `encrypted` payloads.

---

## 2. Conformance

The key words "MUST", "MUST NOT", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

An implementation is conformant if it satisfies all MUST and SHALL requirements.

---

## 3. Message Types

Every message in the Open-Auth transport layer is a JSON object containing a `type` field that identifies its envelope type.

### 3.1 Type Discrimination

Implementations MUST inspect the `type` field of every inbound message to determine processing logic.

The following values are defined:

| `type` Value     | Section | Description                              |
|------------------|---------|------------------------------------------|
| `"pair_complete"`| §4      | Signals successful pairing completion     |
| `"handshake"`    | §5      | Re-establishes a session after disconnect |
| `"encrypted"`    | §6      | Carries an E2EE application message       |

### 3.2 Unknown Types

Implementations MUST silently discard messages with an unrecognized `type` value. Implementations MUST NOT treat unknown types as errors. This ensures forward compatibility when new envelope types are introduced in future protocol versions.

### 3.3 Field Ordering

Implementations MUST NOT depend on the ordering of fields within a JSON message object.

---

## 4. `pair_complete` Message Format

The `pair_complete` message is sent upon successful completion of the pairing flow defined in Layer 0. It transmits the Requester's identity and communication public key to the Authorizer (or vice versa, depending on pairing direction).

This message is **plaintext**. It is transmitted exactly once per pairing and MUST NOT be retransmitted after a session is established.

### 4.1 Schema

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

### 4.2 Field Definitions

| Field            | Type   | Required | Description |
|------------------|--------|----------|-------------|
| `type`           | string | REQUIRED | MUST be `"pair_complete"`. |
| `agentPublicKey` | string | REQUIRED | The Requester's X25519 public key, encoded as a lowercase hexadecimal string. MUST be exactly 64 hex characters (32 bytes). |
| `machineId`      | string | REQUIRED | A stable identifier for the Requester's machine or runtime environment, encoded as a lowercase hexadecimal string. Used by the Authorizer to detect device changes. |
| `protocol`       | string | REQUIRED | Protocol version identifier. MUST be `"open-auth/1.0"` for this specification version. |
| `authorizerId`   | string | REQUIRED | The identifier of the Authorizer this pairing targets. The Authorizer uses this field to confirm the pairing was intended for it. |
| `deviceType`     | string | REQUIRED | The category of the requesting device. MUST be one of: `"agent"`, `"service"`, or `"cli"`. |
| `deviceName`     | string | OPTIONAL | A human-readable display name for the Requester (e.g., `"Claude Desktop"`, `"deploy-bot"`). If omitted, the Authorizer SHOULD use `deviceType` as a fallback display label. |

### 4.3 Validation Rules

Implementations receiving a `pair_complete` message MUST validate:

1. The `type` field equals `"pair_complete"`.
2. All REQUIRED fields are present and are of type `string`.
3. `agentPublicKey` is a valid 64-character lowercase hexadecimal string.
4. `protocol` matches a version the implementation supports.
5. `deviceType` is one of the defined values.

If validation fails, the implementation MUST reject the pairing and SHOULD communicate the failure to the user.

### 4.4 Example

```json
{
  "type": "pair_complete",
  "agentPublicKey": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "machineId": "f0e1d2c3b4a5f0e1d2c3b4a5f0e1d2c3",
  "protocol": "open-auth/1.0",
  "authorizerId": "auth-7k9x2m",
  "deviceType": "agent",
  "deviceName": "Claude Desktop"
}
```

---

## 5. `handshake` Message Format

The `handshake` message re-establishes a previously paired session after a network disconnection or process restart. Both parties already possess keying material from the original pairing; the handshake allows them to confirm continued identity without repeating the full pairing flow.

This message is **plaintext**. It carries public keys for identity verification but does not contain application data.

### 5.1 Requester-Initiated Handshake

When a Requester reconnects to a relay or transport channel, it MUST send a handshake message containing its public key, machine identifier, and a reconnection flag.

#### Schema

```json
{
  "type": "handshake",
  "publicKey": "<hex>",
  "machineId": "<hex>",
  "reconnect": true
}
```

#### Field Definitions

| Field       | Type    | Required | Description |
|-------------|---------|----------|-------------|
| `type`      | string  | REQUIRED | MUST be `"handshake"`. |
| `publicKey` | string  | REQUIRED | The Requester's X25519 public key, encoded as a lowercase hexadecimal string. MUST be exactly 64 hex characters (32 bytes). |
| `machineId` | string  | REQUIRED | The Requester's stable machine identifier, encoded as a lowercase hexadecimal string. MUST match the `machineId` sent during the original `pair_complete`. |
| `reconnect` | boolean | REQUIRED | MUST be `true`. Signals that this is a session re-establishment, not an initial pairing. |

### 5.2 Authorizer Response Handshake

Upon receiving a valid Requester-initiated handshake, the Authorizer MUST respond with its own handshake message containing its public key.

#### Schema

```json
{
  "type": "handshake",
  "publicKey": "<hex>"
}
```

#### Field Definitions

| Field       | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `type`      | string | REQUIRED | MUST be `"handshake"`. |
| `publicKey` | string | REQUIRED | The Authorizer's X25519 public key, encoded as a lowercase hexadecimal string. MUST be exactly 64 hex characters (32 bytes). |

### 5.3 Handshake Sequence

The handshake follows a strict two-message sequence:

```
Requester                         Authorizer
    │                                  │
    │─── handshake (reconnect) ───────>│
    │                                  │  verify publicKey + machineId
    │<── handshake (response) ─────────│
    │                                  │
    │    [session re-established]      │
```

1. The Requester sends a handshake with `reconnect: true`.
2. The Authorizer verifies that `publicKey` and `machineId` match a known pairing.
3. If verification succeeds, the Authorizer responds with its own handshake containing its `publicKey`.
4. The Requester verifies the Authorizer's `publicKey` matches the stored pairing.
5. Both parties resume sending `encrypted` messages.

If the Authorizer cannot match the Requester's identity to a known pairing, it MUST NOT respond. The Requester SHOULD treat a missing response as a failed reconnection and MAY initiate a new pairing flow.

### 5.4 Validation Rules

Implementations receiving a handshake message MUST validate:

1. The `type` field equals `"handshake"`.
2. `publicKey` is a valid 64-character lowercase hexadecimal string.
3. For Requester-initiated messages: `machineId` is present and `reconnect` is `true`.
4. The `publicKey` matches a previously paired peer.

### 5.5 Examples

**Requester-initiated handshake:**

```json
{
  "type": "handshake",
  "publicKey": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  "machineId": "f0e1d2c3b4a5f0e1d2c3b4a5f0e1d2c3",
  "reconnect": true
}
```

**Authorizer response handshake:**

```json
{
  "type": "handshake",
  "publicKey": "b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3"
}
```

---

## 6. `encrypted` Message Format

The `encrypted` message carries all post-pairing application data between a Requester and an Authorizer. The message body is an opaque, base64-encoded E2EE binary envelope as defined in [security/spec.md](../security/spec.md).

Neither the transport layer nor any intermediary (such as a relay server) can inspect or modify the plaintext content of an `encrypted` message.

### 6.1 Request Direction (Requester → Authorizer)

When a Requester sends an application-level request to an Authorizer, the `encrypted` envelope contains only the `type` and `payload` fields.

#### Schema

```json
{
  "type": "encrypted",
  "payload": "<base64>"
}
```

#### Field Definitions

| Field     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `type`    | string | REQUIRED | MUST be `"encrypted"`. |
| `payload` | string | REQUIRED | The E2EE binary envelope, encoded as a standard base64 string ([RFC 4648 §4](https://www.rfc-editor.org/rfc/rfc4648#section-4)). The binary envelope structure is defined in [security/spec.md](../security/spec.md). |

### 6.2 Response Direction (Authorizer → Requester)

When an Authorizer sends an application-level response, the `encrypted` envelope includes a top-level `requestId` field in addition to `type` and `payload`. This `requestId` enables relay-based routing of responses back to the correct pending HTTP request (see §7).

#### Schema

```json
{
  "type": "encrypted",
  "payload": "<base64>",
  "requestId": "<string>"
}
```

#### Field Definitions

| Field       | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `type`      | string | REQUIRED | MUST be `"encrypted"`. |
| `payload`   | string | REQUIRED | The E2EE binary envelope, encoded as a standard base64 string. |
| `requestId` | string | REQUIRED | The correlation identifier echoed from the original request. Used by the relay to route the response to the correct pending connection. See §7 for correlation semantics. |

### 6.3 Payload Structure

The `payload` field is a base64 encoding of the E2EE binary envelope defined in [security/spec.md](../security/spec.md). The transport layer treats this value as opaque. Implementations MUST NOT attempt to parse, validate, or modify the `payload` at the transport layer — decryption and validation are the responsibility of the Security layer (Layer 2).

### 6.4 Examples

**Request (Requester → Authorizer):**

```json
{
  "type": "encrypted",
  "payload": "AAAAIKvNEej3cFrMQkL5NRiZ2x8Hb4Xv9kGJPqmTz1YwFhRnAAAADCi9J7sVfQxk2Ym..."
}
```

**Response (Authorizer → Requester):**

```json
{
  "type": "encrypted",
  "payload": "AAAAILw2Mpo8Hn5TqRsKy7dVzA9fXjU1bCeWm4Dv6gNxOiSkAAAADDk3Fp7Uh1Rvn8Y...",
  "requestId": "req-1710892345-a8f3bc"
}
```

---

## 7. `requestId` Correlation

The `requestId` mechanism provides end-to-end correlation between requests and responses, enabling relay servers to route encrypted responses without accessing plaintext content.

### 7.1 Lifecycle

1. The Requester generates a unique `requestId` for every application-level request.
2. The `requestId` is included **inside** the E2EE plaintext of the request (defined in [application/spec.md](../application/spec.md)).
3. The Authorizer decrypts the request, processes it, and constructs a response. The response includes the same `requestId` in **two** locations:
   - **Inside** the E2EE plaintext of the response (for end-to-end verification).
   - **At the top level** of the `encrypted` envelope (for relay routing).
4. The relay reads the top-level `requestId` to route the response to the correct pending HTTP connection or WebSocket frame.
5. The Requester receives the response, decrypts the payload, and verifies that the `requestId` in the E2EE plaintext matches the expected value.

### 7.2 Correlation Diagram

```
Requester                    Relay                      Authorizer
    │                          │                             │
    │── encrypted ────────────>│                             │
    │   (no top-level reqId)   │── encrypted ───────────────>│
    │                          │   (no top-level reqId)      │
    │                          │                             │  decrypt, process
    │                          │<── encrypted ───────────────│
    │                          │   requestId: "req-..."      │
    │<── encrypted ────────────│                             │
    │   requestId: "req-..."   │                             │
    │                          │                             │
    │  decrypt, verify reqId   │                             │
```

### 7.3 Format

The `requestId` SHOULD follow the format:

```
req-{timestamp}-{random}
```

Where:
- `{timestamp}` is a Unix timestamp in seconds (e.g., `1710892345`).
- `{random}` is a cryptographically random hex string of at least 6 characters.

**Example:** `"req-1710892345-a8f3bc"`

Implementations MAY use alternative formats provided the values are unique within a session. Implementations MUST NOT reuse a `requestId` within the same session.

### 7.4 Relay Behavior

The relay server:

- MUST read the top-level `requestId` from response-direction `encrypted` messages.
- MUST use this value to match the response to the originating request connection.
- MUST NOT attempt to parse, decrypt, or interpret the `payload` field.
- SHOULD discard responses with a `requestId` that does not match any pending request.
- SHOULD enforce a timeout on pending requests (RECOMMENDED: 120 seconds).

### 7.5 Security Considerations

The top-level `requestId` is visible to the relay and any network intermediary. It MUST NOT contain sensitive information. It exists solely for routing and does not authenticate the response — authentication is provided by the E2EE layer.

The Requester MUST verify the `requestId` inside the decrypted plaintext matches the expected value. The top-level `requestId` alone is insufficient for security purposes, as it could be spoofed by a compromised relay.

---

## 8. Transport Agnosticism

The Open-Auth protocol is transport-agnostic. This specification defines message structure and semantics only. It does not prescribe how messages are delivered between parties.

### 8.1 Requirements for Transport Implementations

Any system that carries Open-Auth messages between a Requester and an Authorizer is a **transport implementation**. Transport implementations MUST satisfy the following requirements:

| Requirement | Level | Description |
|-------------|-------|-------------|
| Bidirectional | MUST | The transport MUST support bidirectional message delivery between Requester and Authorizer. |
| JSON preservation | MUST | The transport MUST deliver JSON messages without modification to field names, values, or structure. |
| Ordering | MUST | The transport MUST preserve message ordering within a session. Messages sent by one party MUST be received by the other party in the same order. |
| At-most-once delivery | MUST | The transport MUST deliver each message exactly once, or not at all. Duplicate delivery is a protocol violation. |
| Framing | MUST | The transport MUST provide message framing such that each JSON object is delivered as a discrete unit. |
| Lossless encoding | MUST | The transport MUST NOT alter the byte-level content of string values (particularly `payload` and hex-encoded keys). |

### 8.2 Compatible Transports

The following transport mechanisms are known to be compatible with this specification:

| Transport | Notes |
|-----------|-------|
| **HTTP relay** | The reference transport. Requester sends via HTTP POST; Authorizer receives via long-polling or server-sent events. Responses routed via `requestId`. |
| **WebSocket** | Full-duplex. Each WebSocket text frame carries one JSON message. |
| **Bluetooth LE** | Suitable for proximity-based pairing and authorization. Requires a framing layer over GATT characteristics. |
| **Local IPC** | Unix domain sockets, named pipes, or localhost TCP. Suitable for same-machine Requester/Authorizer deployments. |

### 8.3 Transport-Level Errors

Transport-level errors (connection drops, timeouts, delivery failures) are outside the scope of this specification. Transport implementations SHOULD:

- Expose connection state to the protocol layer so that reconnection (via `handshake`) can be initiated.
- Not silently retry message delivery, as this risks violating the at-most-once delivery requirement.
- Surface transport errors to the application layer, which MAY choose to retry at the application level with a new `requestId`.

### 8.4 No Transport-Level Authentication

The transport layer does not authenticate peers. All authentication is performed at the Security layer (Layer 2) via cryptographic key verification. A transport implementation MUST NOT assume that transport-level identity (e.g., IP address, TLS client certificate) corresponds to protocol-level identity.

---

## Appendix A: Complete Message Type Summary

```
┌──────────────────────────────────────────────────────────────────┐
│                     Open-Auth Transport Messages                  │
├────────────────┬──────────┬──────────────────────────────────────┤
│ type           │ Encrypt. │ Fields                               │
├────────────────┼──────────┼──────────────────────────────────────┤
│ pair_complete  │ Plain    │ agentPublicKey, machineId, protocol, │
│                │          │ authorizerId, deviceType, deviceName │
├────────────────┼──────────┼──────────────────────────────────────┤
│ handshake      │ Plain    │ publicKey, machineId*, reconnect*    │
│ (requester)    │          │ (* requester-initiated only)         │
├────────────────┼──────────┼──────────────────────────────────────┤
│ handshake      │ Plain    │ publicKey                            │
│ (authorizer)   │          │                                      │
├────────────────┼──────────┼──────────────────────────────────────┤
│ encrypted      │ E2EE     │ payload                              │
│ (request)      │          │                                      │
├────────────────┼──────────┼──────────────────────────────────────┤
│ encrypted      │ E2EE     │ payload, requestId                   │
│ (response)     │          │                                      │
└────────────────┴──────────┴──────────────────────────────────────┘
```

## Appendix B: JSON Schema Reference

### B.1 `pair_complete`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "pair_complete",
  "type": "object",
  "required": ["type", "agentPublicKey", "machineId", "protocol", "authorizerId", "deviceType"],
  "properties": {
    "type": { "const": "pair_complete" },
    "agentPublicKey": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$",
      "description": "Requester X25519 public key (32 bytes, hex-encoded)"
    },
    "machineId": {
      "type": "string",
      "pattern": "^[0-9a-f]+$",
      "description": "Stable machine identifier (hex-encoded)"
    },
    "protocol": {
      "type": "string",
      "const": "open-auth/1.0",
      "description": "Protocol version"
    },
    "authorizerId": {
      "type": "string",
      "minLength": 1,
      "description": "Target Authorizer identifier"
    },
    "deviceType": {
      "type": "string",
      "enum": ["agent", "service", "cli"],
      "description": "Requester device category"
    },
    "deviceName": {
      "type": "string",
      "description": "Human-readable device name (optional)"
    }
  },
  "additionalProperties": false
}
```

### B.2 `handshake` (Requester-initiated)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "handshake_requester",
  "type": "object",
  "required": ["type", "publicKey", "machineId", "reconnect"],
  "properties": {
    "type": { "const": "handshake" },
    "publicKey": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$",
      "description": "Requester X25519 public key (32 bytes, hex-encoded)"
    },
    "machineId": {
      "type": "string",
      "pattern": "^[0-9a-f]+$",
      "description": "Stable machine identifier (hex-encoded)"
    },
    "reconnect": {
      "type": "boolean",
      "const": true,
      "description": "Reconnection flag"
    }
  },
  "additionalProperties": false
}
```

### B.3 `handshake` (Authorizer response)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "handshake_authorizer",
  "type": "object",
  "required": ["type", "publicKey"],
  "properties": {
    "type": { "const": "handshake" },
    "publicKey": {
      "type": "string",
      "pattern": "^[0-9a-f]{64}$",
      "description": "Authorizer X25519 public key (32 bytes, hex-encoded)"
    }
  },
  "additionalProperties": false
}
```

### B.4 `encrypted` (Request)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "encrypted_request",
  "type": "object",
  "required": ["type", "payload"],
  "properties": {
    "type": { "const": "encrypted" },
    "payload": {
      "type": "string",
      "pattern": "^[A-Za-z0-9+/]+=*$",
      "description": "Base64-encoded E2EE binary envelope"
    }
  },
  "additionalProperties": false
}
```

### B.5 `encrypted` (Response)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "encrypted_response",
  "type": "object",
  "required": ["type", "payload", "requestId"],
  "properties": {
    "type": { "const": "encrypted" },
    "payload": {
      "type": "string",
      "pattern": "^[A-Za-z0-9+/]+=*$",
      "description": "Base64-encoded E2EE binary envelope"
    },
    "requestId": {
      "type": "string",
      "minLength": 1,
      "description": "Correlation ID for relay routing"
    }
  },
  "additionalProperties": false
}
```
