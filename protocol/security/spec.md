# Open-Auth Protocol — Layer 2: End-to-End Encryption (E2EE)

**Status:** Draft\
**Version:** 0.1.0\
**Layer:** 2 (Security)\
**Dependencies:** Layer 1 (Relay Transport)

---

## 1. Overview

This document specifies Layer 2 of the Open-Auth protocol stack. Layer 2
provides end-to-end encryption between the Requester and the Approver,
ensuring the relay server and any network intermediary observes only opaque
ciphertext. Neither the relay operator nor a man-in-the-middle who has
compromised the relay can read or forge application-layer messages.

The protocol relies on three cryptographic primitives:

| Primitive | Purpose | Reference |
|---|---|---|
| X25519 (Curve25519 ECDH) | Key agreement | RFC 7748 |
| HKDF-SHA256 | Key derivation | RFC 5869 |
| AES-256-GCM | Authenticated encryption | NIST SP 800-38D |

All multi-byte integers in this specification are big-endian unless stated
otherwise. The key words "MUST", "MUST NOT", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" are to be interpreted as
described in RFC 2119.

---

## 2. X25519 ECDH Shared Secret

### 2.1 Key Generation

Each party (Requester and Approver) SHALL generate an X25519 key pair
consisting of a 32-byte private key and a 32-byte public key. Key generation
MUST follow the procedure defined in RFC 7748 §5, including clamping of the
private scalar.

### 2.2 Key Exchange

Public keys are exchanged during the Layer 1 handshake (see Layer 1
specification). Once both parties possess the remote public key, each party
computes the shared secret:

```
sharedSecret = X25519(localPrivateKey, remotePublicKey)
```

The result is a 32-byte value. By the commutativity of X25519, both parties
derive an identical shared secret.

### 2.3 Validation

Implementations MUST reject the all-zeros public key (the identity point on
Curve25519). Receiving an all-zeros public key SHALL be treated as a protocol
error and the session MUST be aborted.

### 2.4 Test Vectors

Implementations SHOULD verify their X25519 implementation against the test
vectors published in RFC 7748 §6.1 before deployment. Failure to match the
published vectors indicates a defective implementation that MUST NOT be used.

---

## 3. HKDF-SHA256 Key Derivation

### 3.1 Parameters

The raw 32-byte X25519 shared secret is the sole input keying material (IKM)
to HKDF-SHA256. The derivation uses the following parameters:

| Parameter | Value |
|---|---|
| Hash | SHA-256 |
| IKM | X25519 shared secret (32 bytes) |
| Salt | Empty (zero-length byte string) |
| Info | UTF-8 encoding of `"open-auth-e2ee-v1"` (18 bytes) |
| L (output length) | 32 bytes |

The derivation proceeds in two stages per RFC 5869:

```
PRK  = HKDF-Extract(salt = "", IKM = sharedSecret)
Key  = HKDF-Expand(PRK, info = "open-auth-e2ee-v1", L = 32)
```

The 32-byte output is the symmetric session key used for AES-256-GCM.

### 3.2 Protocol Isolation

The `info` parameter binds the derived key to this specific protocol. A
different application using the same X25519 shared secret but a different info
string will derive a completely independent key. For example, the claw-wallet
application uses info string `"claw-wallet-e2ee-v1"`, producing different
derived keys even when operating over the same shared secret. This guarantees
cryptographic isolation between protocol domains.

### 3.3 Empty Salt

When salt is empty (zero-length), HKDF-Extract uses a hash-length block of
zeros as the salt per RFC 5869 §2.2. Implementations MUST NOT substitute a
non-empty salt unless a future version of this specification explicitly
redefines this parameter.

---

## 4. AES-256-GCM Encryption

### 4.1 Algorithm Parameters

| Parameter | Value |
|---|---|
| Algorithm | AES-256-GCM (NIST SP 800-38D) |
| Key | 32-byte HKDF output (§3) |
| Nonce | 12 bytes (see §4.2) |
| Plaintext | UTF-8 encoded JSON message |
| AAD | Empty (zero-length) |
| Tag length | 16 bytes (128 bits) |

### 4.2 Nonce Construction

The 12-byte nonce is deterministically constructed from the message sequence
number. The sequence number is a 32-bit unsigned integer encoded in big-endian
byte order and placed at byte positions 4–7 (zero-indexed) of the nonce. All
other positions are zero-filled.

```
Byte index:   0    1    2    3    4    5    6    7    8    9   10   11
            +----+----+----+----+----+----+----+----+----+----+----+----+
Value:      |0x00|0x00|0x00|0x00| S3 | S2 | S1 | S0 |0x00|0x00|0x00|0x00|
            +----+----+----+----+----+----+----+----+----+----+----+----+
                                 \______________________/
                                  4-byte big-endian seq
```

Where `S3` is the most significant byte and `S0` is the least significant byte
of the sequence number.

**Example:** Sequence number 1 (`0x00000001`) produces nonce:

```
00 00 00 00 00 00 00 01 00 00 00 00
```

**Example:** Sequence number 256 (`0x00000100`) produces nonce:

```
00 00 00 00 00 00 01 00 00 00 00 00
```

Implementations MUST NOT reuse a nonce with the same key. Because each message
increments the sequence number (§6), and the sequence number is embedded
deterministically in the nonce, nonce uniqueness is guaranteed as long as the
sequence counter is correctly maintained.

### 4.3 Encryption

```
(ciphertext, tag) = AES-256-GCM-Encrypt(key, nonce, plaintext, aad = "")
```

The output is the concatenation of ciphertext and the 16-byte authentication
tag. The total output length is `len(plaintext) + 16` bytes.

### 4.4 Decryption

```
plaintext = AES-256-GCM-Decrypt(key, nonce, ciphertext || tag, aad = "")
```

If authentication fails, the implementation MUST discard the message and MUST
NOT process any portion of the plaintext. Authentication failure SHALL be
treated as a potential tampering event and MAY be logged.

---

## 5. Binary Envelope Format

### 5.1 Structure

Every encrypted message is wrapped in a binary envelope before transmission.
The envelope concatenates the sequence number and the authenticated ciphertext:

```
 0                   4                                        N+20
 +-------------------+------------------------------------------+
 |   Sequence Number |  AES-GCM Ciphertext + Auth Tag           |
 |   (4 bytes, BE)   |  (N + 16 bytes)                          |
 +-------------------+------------------------------------------+
 |<---- header ----->|<----------- encrypted body ------------->|
```

Byte-level layout:

```
Offset  Length   Field
──────  ──────   ──────────────────────────────────
0       4        Sequence number (uint32, big-endian)
4       N        AES-GCM ciphertext (same length as plaintext)
4+N     16       AES-GCM authentication tag
──────  ──────   ──────────────────────────────────
Total:  N + 20   Complete binary envelope
```

Where N is the byte length of the UTF-8 encoded JSON plaintext.

### 5.2 Wire Encoding

The binary envelope is base64-encoded (standard alphabet, with padding) and
placed in the `payload` field of the encrypted transport message:

```json
{
  "type": "encrypted",
  "payload": "<base64(binary_envelope)>"
}
```

Implementations MUST use standard base64 (RFC 4648 §4) with `=` padding.
Decoders SHOULD accept both padded and unpadded input.

### 5.3 Size Constraints

The maximum plaintext message size is 64 KiB (65,536 bytes). Messages
exceeding this limit MUST be rejected before encryption. After base64 encoding,
the maximum `payload` string length is approximately 87,408 characters
(`ceil((65536 + 20) / 3) * 4`).

---

## 6. Anti-Replay Protection

### 6.1 Sequence Counters

Each party maintains a **send sequence counter**, a 32-bit unsigned integer
that starts at 0 and increments by 1 for each message sent. Each direction of
communication has independent counters: the Requester's send counter is
unrelated to the Approver's send counter.

The send counter MUST be incremented **after** successful encryption. If
encryption fails, the counter MUST NOT advance.

### 6.2 Receive Validation

Upon receiving a message, the recipient extracts the 4-byte sequence number
from the binary envelope header (§5.1) and applies the following checks:

1. **Replay check:** If `seq <= highest_received`, the message MUST be
   rejected. This prevents replay of previously observed messages.

2. **Gap check:** If `seq > highest_received + 100`, the message MUST be
   rejected. An excessive gap indicates either message loss beyond recovery or
   a protocol anomaly.

If both checks pass, the recipient proceeds with decryption. Upon successful
decryption, `highest_received` is updated to `seq`.

### 6.3 Initial State

The initial value of `highest_received` is -1 (conceptually; implemented as a
flag indicating no messages have been received). This allows the first message
with sequence number 0 to be accepted.

### 6.4 Rejection Behavior

Rejected messages SHALL be silently discarded. The implementation MUST NOT
send an error response for rejected messages, as doing so would leak
information to a potential attacker. Implementations MAY log rejections locally
for diagnostic purposes.

### 6.5 Counter Exhaustion

When the send sequence counter reaches 2^32 - 1 (`0xFFFFFFFF`), the session
key is exhausted. The sender MUST NOT encrypt further messages with this key.
Both parties MUST perform a new key exchange to continue communication. Under
normal usage patterns, counter exhaustion is not expected to occur within a
single session.

---

## 7. Reconnection Verification

When a Requester reconnects to an existing session (indicated by `reconnect:
true` in the Layer 1 handshake), the Approver SHALL apply a three-level
verification sequence. All three levels MUST be evaluated in order. A failure
at any level terminates the verification process.

### 7.1 Level 1 — Public Key Verification (Hard)

The Approver MUST compare the Requester's public key presented during
reconnection with the public key stored from the original pairing handshake.

- **Match:** Proceed to Level 2.
- **Mismatch:** The Approver MUST reject the reconnection and MUST require a
  full re-pairing. The existing session MUST be invalidated.

This check ensures that the reconnecting party possesses the same long-term
identity key as the original Requester.

### 7.2 Level 2 — Machine Identity Verification (Hard)

The Approver MUST compare the Requester's `machineId` presented during
reconnection with the `machineId` stored from the original pairing.

- **Match:** Proceed to Level 3.
- **Mismatch:** The Approver MUST freeze the session. While frozen:
  - No requests SHALL be processed.
  - The session remains in a suspended state until the user explicitly
    re-pairs.
  - The Approver SHOULD notify the user of a potential security issue,
    indicating that a different machine attempted to resume the session.

A `machineId` mismatch with a matching public key may indicate key
exfiltration and is treated as a high-severity security event.

### 7.3 Level 3 — IP Address Policy (Configurable)

The Approver evaluates the Requester's IP address against the IP recorded
during the original pairing. This level supports three configurable modes:

| Mode | Behavior |
|---|---|
| `block` | Reject connections from any IP address that differs from the original pairing IP. The reconnection MUST be denied. |
| `warn` (default) | If the new IP is in the same subnet (/24 for IPv4, /64 for IPv6) as the original, allow the connection. If the subnet differs, flag the connection for user review. The session SHALL be suspended until the user explicitly approves or denies. |
| `allow` | No IP-based restrictions. All source IPs are accepted. |

The default mode is `warn`. The mode is configured by the Approver and MAY be
changed at any time without re-pairing.

### 7.4 Verification Outcome

If all three levels pass, the Approver SHALL accept the reconnection. The
existing session key MAY be reused if counter state is intact, or a new key
exchange MAY be performed at the Approver's discretion. Sequence counters MUST
continue from their last known values; they SHALL NOT be reset on
reconnection.

---

## 8. Key Material Zeroing

### 8.1 Private Key Lifecycle

X25519 private keys MUST be zeroed from memory immediately after the session
key has been derived. The private key is needed only during the ECDH
computation (§2.2) and MUST NOT persist beyond that point.

### 8.2 Shared Secret Lifecycle

The raw X25519 shared secret (32 bytes) MUST be zeroed from memory immediately
after HKDF derivation (§3.1) completes. The shared secret is an intermediate
value and MUST NOT be stored, logged, or transmitted.

### 8.3 Zeroing Procedure

Implementations MUST overwrite sensitive key material with zeros before
releasing the memory. The zeroing operation MUST NOT be optimizable away by the
compiler or runtime. Implementations SHOULD use platform-specific secure
zeroing primitives where available:

| Platform | Recommended API |
|---|---|
| C/C++ | `explicit_bzero()`, `SecureZeroMemory()` |
| Rust | `zeroize` crate |
| Go | `crypto/subtle.ConstantTimeCompare` patterns, manual zeroing |
| JavaScript | Overwrite `Uint8Array` with zeros; note GC limitations |
| Python | `ctypes.memset`; note interpreter limitations |

### 8.4 Scope of Zeroing

The following values MUST be zeroed when no longer needed:

| Value | Zero after |
|---|---|
| X25519 private key | Session key derived (§3.1) |
| X25519 shared secret | HKDF output produced (§3.1) |
| HKDF PRK (intermediate) | HKDF-Expand complete (§3.1) |
| Session key | Session terminated or rekeyed |

### 8.5 Limitations

In garbage-collected runtimes (JavaScript, Python, Go), true secure erasure
cannot be guaranteed because the runtime may copy or relocate memory without
the application's knowledge. Implementations in such environments SHOULD still
perform best-effort zeroing and SHOULD document the limitation. Where the
threat model demands strong memory erasure guarantees, implementations SHOULD
perform cryptographic operations in a native module (e.g., WebAssembly, C FFI).

---

## Appendix A. Glossary

| Term | Definition |
|---|---|
| Approver | The party that holds credentials and approves authentication requests. |
| Requester | The party that initiates authentication requests (e.g., a browser extension). |
| Relay | The intermediary server that forwards encrypted messages between parties. |
| Session key | The 32-byte AES-256-GCM key derived via HKDF from the shared secret. |
| Pairing | The initial handshake where parties exchange public keys and establish a session. |
| Reconnection | A subsequent handshake where a Requester resumes an existing session. |

## Appendix B. References

- **RFC 7748** — Elliptic Curves for Security (X25519)
- **RFC 5869** — HMAC-based Extract-and-Expand Key Derivation Function (HKDF)
- **RFC 4648** — The Base16, Base32, and Base64 Data Encodings
- **RFC 2119** — Key words for use in RFCs
- **NIST SP 800-38D** — Recommendation for Block Cipher Modes: GCM
