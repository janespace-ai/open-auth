# Open-Auth Protocol: Pairing Specification

**Version:** 1.0-draft  
**Layer:** 0 — Pairing  
**Status:** Draft  

---

## 1. Overview

Pairing is Layer 0 of the open-auth protocol stack. It establishes a secure, authenticated channel between two parties:

- **Authorizer** — the entity that holds signing authority (e.g., a wallet, approval device).
- **Requester** — the entity that initiates requests requiring authorization (e.g., an agent, CLI tool, service).

A successful pairing produces a shared secret (via X25519 ECDH) and a deterministic `pairId` that uniquely identifies the relationship. All subsequent protocol layers depend on this pairing.

This specification covers:

- Short-code and QR-code pairing initiation
- X25519 key exchange
- `pairId` derivation
- Persistent pairing storage
- Backward compatibility with claw-wallet Desktop

### 1.1. Terminology

The key words "MUST", "MUST NOT", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "REQUIRED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119).

### 1.2. Notation

All public keys and hashes are encoded as lowercase hexadecimal strings unless otherwise noted. Byte lengths refer to the raw binary representation; hex-encoded lengths are double the byte length.

---

## 2. Short-Code Pairing Initiation

Short-code pairing allows an Authorizer to advertise availability and a Requester to discover it through a human-readable code.

### 2.1. Authorizer Key Generation

The Authorizer SHALL generate an X25519 key pair for use as its communication key pair:

- `authorizerCommPriv` — 32-byte X25519 private key (kept secret)
- `authorizerCommPub` — 32-byte X25519 public key (shared with the Requester)

This key pair is distinct from any signing or wallet keys the Authorizer may hold. It is used exclusively for ECDH key agreement within this protocol.

### 2.2. Relay Registration

The Authorizer SHALL register with a relay server by sending an HTTP POST request.

**Request:**

```
POST /pairing/create
Content-Type: application/json
```

```json
{
  "authorizerId": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
  "publicKey": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
}
```

| Field          | Type   | Description                                                        |
|----------------|--------|--------------------------------------------------------------------|
| `authorizerId` | string | Stable identifier for the Authorizer (e.g., wallet address, DID).  |
| `publicKey`    | string | Hex-encoded X25519 public key (64 hex characters / 32 bytes).      |

**Response:**

```
HTTP/1.1 201 Created
Content-Type: application/json
```

```json
{
  "code": "AB3K7W2X",
  "expiresAt": "2026-03-23T12:10:00Z",
  "ttl": 600
}
```

| Field       | Type   | Description                                            |
|-------------|--------|--------------------------------------------------------|
| `code`      | string | 8-character short code.                                |
| `expiresAt` | string | ISO 8601 timestamp when the code expires.              |
| `ttl`       | number | Time-to-live in seconds. Default: 600 (10 minutes).    |

### 2.3. Short-Code Format

The short code SHALL be exactly 8 characters drawn from the following charset:

```
A B C D E F G H J K L M N P Q R S T U V W X Y Z 2 3 4 5 6 7 8 9
```

This is the uppercase Latin alphabet **excluding** `I` and `O`, plus the digits `2` through `9` — a 32-character alphabet chosen to avoid visually ambiguous characters (`I`/`1`, `O`/`0`).

Code resolution SHALL be case-insensitive. The relay MUST accept `ab3k7w2x`, `AB3K7W2X`, and `Ab3k7W2x` as equivalent.

The relay SHOULD support configurable TTL via an optional `ttl` field in the registration request. If omitted, the relay SHALL use a default TTL of 600 seconds (10 minutes).

### 2.4. Code Resolution

The Requester resolves a short code to obtain the Authorizer's public key and identifier.

**Request:**

```
GET /pairing/resolve?code=AB3K7W2X
```

**Response:**

```
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "authorizerId": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
  "publicKey": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
}
```

If the code is expired or invalid, the relay SHALL respond with:

```
HTTP/1.1 404 Not Found
Content-Type: application/json
```

```json
{
  "error": "code_not_found",
  "message": "The pairing code is invalid or has expired."
}
```

---

## 3. QR Code Pairing

QR code pairing provides an alternative initiation method that encodes the short code and relay URL into a scannable format.

### 3.1. URI Scheme

The pairing URI SHALL use the following scheme:

```
openauth://pair?code=<shortCode>&relay=<relayUrl>
```

| Parameter | Description                                              |
|-----------|----------------------------------------------------------|
| `code`    | The 8-character short code from Section 2.                |
| `relay`   | The URL-encoded base URL of the relay server.             |

**Example:**

```
openauth://pair?code=AB3K7W2X&relay=https%3A%2F%2Frelay.openauth.dev
```

### 3.2. QR Encoding

The QR code SHALL encode the pairing URI as a UTF-8 string. Implementations SHOULD use QR error correction level M or higher.

### 3.3. Requester Processing

Upon scanning the QR code, the Requester SHALL:

1. Parse the URI and extract the `code` and `relay` parameters.
2. Validate that the URI scheme is `openauth`.
3. Resolve the short code against the specified relay as described in Section 2.4.

If the `relay` parameter is absent, the Requester MAY fall back to a configured default relay.

---

## 4. X25519 Key Exchange

After resolving the short code, the Requester and Authorizer perform an X25519 key exchange to establish a shared secret.

### 4.1. Requester Key Generation

The Requester SHALL generate its own X25519 key pair:

- `requesterCommPriv` — 32-byte X25519 private key (kept secret)
- `requesterCommPub` — 32-byte X25519 public key (shared with the Authorizer)

### 4.2. pair_complete Message

The Requester SHALL send a `pair_complete` message to the Authorizer through the relay.

**Request:**

```
POST /pairing/complete
Content-Type: application/json
```

```json
{
  "type": "pair_complete",
  "agentPublicKey": "b1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
  "machineId": "3a7f2b1c9e4d8f05",
  "protocol": "open-auth/1.0",
  "authorizerId": "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
  "deviceType": "agent",
  "deviceName": "dev-server-01"
}
```

| Field            | Type   | Required | Description                                                              |
|------------------|--------|----------|--------------------------------------------------------------------------|
| `type`           | string | REQUIRED | MUST be `"pair_complete"`.                                               |
| `agentPublicKey` | string | REQUIRED | Hex-encoded X25519 public key of the Requester (64 hex chars).           |
| `machineId`      | string | REQUIRED | First 16 hex characters of `SHA256(hostname + ":" + MAC_address)`.       |
| `protocol`       | string | REQUIRED | Protocol version identifier. MUST be `"open-auth/1.0"` for this spec.   |
| `authorizerId`   | string | REQUIRED | The Authorizer identifier obtained during code resolution.               |
| `deviceType`     | string | REQUIRED | One of: `"agent"`, `"service"`, `"cli"`.                                 |
| `deviceName`     | string | OPTIONAL | Human-readable device name for display in the Authorizer UI.             |

### 4.3. machineId Derivation

The `machineId` SHALL be derived as follows:

```
machineId = hex(SHA256(hostname + ":" + MAC_address))[0:16]
```

- `hostname` — the system hostname as a UTF-8 string.
- `MAC_address` — the primary network interface MAC address as a lowercase colon-separated hex string (e.g., `"aa:bb:cc:dd:ee:ff"`).
- The SHA256 output is hex-encoded and truncated to the first 16 characters (8 bytes).

The `machineId` provides a stable, pseudonymous device fingerprint. It is NOT intended as a security credential.

### 4.4. Shared Secret Derivation

Both parties SHALL derive the shared secret using X25519 ECDH:

**Authorizer computes:**

```
sharedSecret = X25519(authorizerCommPriv, requesterCommPub)
```

**Requester computes:**

```
sharedSecret = X25519(requesterCommPriv, authorizerCommPub)
```

By the properties of X25519, both computations yield the same 32-byte shared secret.

Implementations MUST validate that the computed shared secret is not the all-zero value (which indicates a low-order point attack). If the shared secret is all zeros, the pairing MUST be aborted.

### 4.5. Relay Delivery

The relay SHALL deliver the `pair_complete` message to the Authorizer identified by `authorizerId`. The relay MUST NOT inspect or store the `agentPublicKey` beyond the lifetime needed for message delivery. The relay SHALL delete the pairing code entry after successful delivery of the `pair_complete` message.

---

## 5. pairId Derivation

The `pairId` is a short, deterministic identifier for the pairing relationship. Both parties derive it independently from the exchanged public keys.

### 5.1. Formula

```
pairId = hex(SHA256(authorizerCommPub + ":" + requesterCommPub))[0:16]
```

Where:

- `authorizerCommPub` — the Authorizer's X25519 public key, hex-encoded (64 characters).
- `requesterCommPub` — the Requester's X25519 public key, hex-encoded (64 characters).
- `+` denotes string concatenation.
- `":"` is a literal ASCII colon character (U+003A).
- The SHA256 hash is computed over the UTF-8 encoding of the concatenated string.
- The result is hex-encoded and truncated to the first 16 characters (8 bytes).

### 5.2. Properties

- **Deterministic.** Both parties MUST arrive at the same `pairId` given the same key pair. Implementations MUST verify that the locally derived `pairId` matches the remote party's `pairId` before considering the pairing established.
- **Unique per pairing.** Because the derivation uses the communication public keys (not the `authorizerId` or wallet address), each key exchange produces a distinct `pairId` — even between the same Authorizer and Requester if they re-pair with fresh keys.
- **Compact.** At 16 hex characters (8 bytes / 64 bits), the `pairId` is suitable for use as a relay channel identifier, storage key, and human-inspectable label.

### 5.3. Test Vectors

The following test vectors allow implementations to validate their `pairId` derivation.

**Inputs:**

```
authorizerCommPub = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
requesterCommPub  = "b1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2"
```

**SHA256 input string (129 bytes):**

```
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2:b1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2
```

**Derivation:**

```
fullHash = SHA256("a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2:b1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2")
pairId   = hex(fullHash)[0:16]
```

Implementations MUST verify their output against their SHA256 library using the exact input string above. A reference computation yields:

```
fullHash = "b98e7d5a3f1c2e4b8a6d9f0c1e3b5a7d2f4e6c8a0b1d3f5e7a9c2b4d6f8e0a1c"
pairId   = "b98e7d5a3f1c2e4b"
```

> **Implementer note:** The `fullHash` and `pairId` values above are illustrative placeholders. Implementations MUST verify against their SHA256 library by computing `SHA256` over the exact 129-byte UTF-8 input string shown above. Do not rely on the example hash values for conformance testing.

---

## 6. Persistent Pairing Storage

### 6.1. Storage Requirement

Both Authorizer and Requester MUST persist pairing data after a successful pairing completes. Pairing data MUST survive process restarts, allowing parties to reconnect to the relay and resume communication without repeating the pairing flow.

### 6.2. Required Fields

Each stored pairing record SHALL contain at minimum the following fields:

| Field              | Type   | Description                                                   |
|--------------------|--------|---------------------------------------------------------------|
| `pairId`           | string | The derived pairing identifier (16 hex chars).                |
| `remotePublicKey`  | string | The remote party's X25519 public key (64 hex chars).          |
| `remoteMachineId`  | string | The remote party's `machineId` (16 hex chars).                |
| `authorizerId`     | string | The Authorizer's stable identifier.                           |
| `protocol`         | string | Protocol version (e.g., `"open-auth/1.0"`).                   |
| `deviceType`       | string | Remote device type: `"agent"`, `"service"`, or `"cli"`.       |
| `deviceName`       | string | Remote device's human-readable name (may be empty).           |
| `createdAt`        | string | ISO 8601 timestamp of pairing creation.                       |

Implementations MAY store additional metadata (e.g., last-seen timestamp, connection count) but MUST NOT omit any required field.

### 6.3. Storage Security

Implementations MUST protect the local private key (`authorizerCommPriv` or `requesterCommPriv`) with appropriate access controls. The private key SHOULD be stored in a platform-appropriate secure store (e.g., OS keychain, encrypted file). The private key MUST NOT be included in pairing records that may be exported or logged.

### 6.4. Reconnection

On startup, each party SHALL:

1. Load all persisted pairing records.
2. For each active pairing, reconnect to the relay using the stored `pairId` as the channel identifier.
3. Resume normal message exchange without re-initiating the pairing flow.

If the relay rejects a reconnection (e.g., channel unknown), the implementation SHOULD mark the pairing as stale and MAY prompt the user to re-pair.

---

## 7. claw-wallet Compatibility Note

### 7.1. Legacy Derivation

The claw-wallet Desktop application uses a legacy `pairId` derivation formula:

```
pairId_legacy = hex(SHA256(walletAddress + ":" + agentPubKey))[0:16]
```

Where `walletAddress` is the Authorizer's wallet address (e.g., `"0x1a2b...ef12"`) and `agentPubKey` is the Requester's X25519 public key.

### 7.2. open-auth Derivation

The open-auth protocol uses the derivation specified in Section 5:

```
pairId_openauth = hex(SHA256(authorizerCommPub + ":" + requesterCommPub))[0:16]
```

### 7.3. Non-Collision Property

Because the legacy formula hashes `walletAddress + ":" + agentPubKey` and the open-auth formula hashes `authorizerCommPub + ":" + requesterCommPub`, the two derivations produce different `pairId` values for the same Authorizer–Requester pair. This means:

- A legacy claw-wallet Desktop pairing and an open-auth pairing between the same parties occupy **different relay channels**.
- There is no risk of message cross-contamination between protocol versions.

### 7.4. Agent SDK Requirements

An Agent SDK that supports both claw-wallet Desktop and open-auth Authorizers MUST:

1. Maintain **separate pairing records** per protocol version.
2. Use the correct derivation formula when computing `pairId` for each protocol.
3. Route messages to the correct relay channel based on the pairing's protocol version.
4. NOT attempt to upgrade a legacy pairing to open-auth in-place. A new open-auth pairing MUST be established through the standard pairing flow.

---

## 8. Complete Pairing Sequence

The following diagram illustrates the full pairing flow from initiation to completion.

```
  Authorizer                         Relay                          Requester
  ==========                         =====                          =========
      |                                 |                                |
      |  1. Generate X25519 key pair    |                                |
      |  (authorizerCommPub/Priv)       |                                |
      |                                 |                                |
      |  2. POST /pairing/create        |                                |
      |  { authorizerId, publicKey }    |                                |
      |-------------------------------->|                                |
      |                                 |                                |
      |  3. 201 Created                 |                                |
      |  { code: "AB3K7W2X", ttl: 600 }|                                |
      |<--------------------------------|                                |
      |                                 |                                |
      |  4. Display code / QR           |                                |
      |  openauth://pair?code=AB3K7W2X  |                                |
      |  &relay=https%3A%2F%2Frelay...  |                                |
      |                                 |                                |
      |                                 |  5. User enters code / scans QR|
      |                                 |                                |
      |                                 |  6. GET /pairing/resolve       |
      |                                 |     ?code=AB3K7W2X             |
      |                                 |<-------------------------------|
      |                                 |                                |
      |                                 |  7. 200 OK                     |
      |                                 |  { authorizerId, publicKey }   |
      |                                 |------------------------------->|
      |                                 |                                |
      |                                 |  8. Generate X25519 key pair   |
      |                                 |  (requesterCommPub/Priv)       |
      |                                 |                                |
      |                                 |  9. POST /pairing/complete     |
      |                                 |  { type: "pair_complete",      |
      |                                 |    agentPublicKey,             |
      |                                 |    machineId, protocol,        |
      |                                 |    authorizerId, deviceType }  |
      |                                 |<-------------------------------|
      |                                 |                                |
      | 10. Relay delivers pair_complete|                                |
      |<--------------------------------|                                |
      |                                 |                                |
      | 11. Derive shared secret        |                 11. Derive shared secret
      |  X25519(authPriv, reqPub)       |                  X25519(reqPriv, authPub)
      |                                 |                                |
      | 12. Derive pairId               |                 12. Derive pairId
      |  SHA256(authPub+":"+reqPub)[:16]|                  SHA256(authPub+":"+reqPub)[:16]
      |                                 |                                |
      | 13. Verify pairId match         |                 13. Verify pairId match
      |                                 |                                |
      | 14. Persist pairing record      |                 14. Persist pairing record
      |                                 |                                |
      |<================ Secure channel established =================>|
      |                                 |                                |
```

### 8.1. Step Summary

| Step | Actor      | Action                                                           |
|------|------------|------------------------------------------------------------------|
| 1    | Authorizer | Generates X25519 communication key pair.                         |
| 2    | Authorizer | Registers with relay, sending `authorizerId` and `publicKey`.    |
| 3    | Relay      | Returns 8-character short code with TTL.                         |
| 4    | Authorizer | Displays short code and/or QR code to user.                      |
| 5    | Requester  | User enters short code or scans QR code.                         |
| 6    | Requester  | Resolves code via relay `GET /pairing/resolve`.                  |
| 7    | Relay      | Returns Authorizer's `authorizerId` and `publicKey`.             |
| 8    | Requester  | Generates X25519 communication key pair.                         |
| 9    | Requester  | Sends `pair_complete` message to relay.                          |
| 10   | Relay      | Delivers `pair_complete` to Authorizer; deletes code entry.      |
| 11   | Both       | Derive shared secret via X25519 ECDH.                            |
| 12   | Both       | Derive `pairId` from public keys.                                |
| 13   | Both       | Verify that independently derived `pairId` values match.         |
| 14   | Both       | Persist pairing record for future reconnection.                  |

---

## Appendix A: Security Considerations

- **Short-code entropy.** An 8-character code from a 32-character alphabet provides ~40 bits of entropy. Combined with the default 10-minute TTL and relay rate limiting, this provides adequate resistance to brute-force attacks during the pairing window.
- **Forward secrecy.** Each pairing generates fresh X25519 key pairs. Compromise of one pairing's keys does not affect other pairings.
- **Relay trust model.** The relay is an untrusted message broker. It observes `authorizerId` values and ephemeral public keys but never the shared secret. All sensitive communication after pairing SHOULD be encrypted with the derived shared secret.
- **machineId privacy.** The `machineId` is a truncated hash, not a raw hardware identifier. It enables device recognition without exposing hostname or MAC address to the relay or remote party.
