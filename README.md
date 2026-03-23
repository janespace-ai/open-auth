# Open-Auth

**A universal protocol for AI Agent authorization — your phone approves, your agent acts.**

[中文文档](docs/README.zh-CN.md)

```
┌──────────┐                                    ┌──────────────┐
│          │  "I need to delete                  │              │
│    AI    │   15k expired rows                  │  Your Phone  │
│   Agent  │   from production"                  │              │
│          │ ───────────────────────────────────▶ │  ┌────────┐  │
│          │            E2EE                      │  │Approve?│  │
│          │                                      │  │        │  │
│          │ ◀─────────────────────────────────── │  │  ✓  ✗  │  │
│          │         approved / rejected          │  └────────┘  │
└──────────┘                                    └──────────────┘
```

AI Agents are doing more and more on your behalf — but how do you stay in control? Open-Auth is a protocol that lets any agent ask for your permission before acting. You approve (or reject) on your phone, just like approving a login with Google Authenticator.

## Why Open-Auth?

Today, every agent-to-human authorization system is proprietary. There's no standard way for an agent to say "I need your approval" and for you to respond from a trusted device.

Open-Auth solves this with:

- **A universal protocol** — any agent, any authorizer, any action
- **End-to-end encryption** — the relay server sees nothing, only you and your agent share the secret
- **Capability-based** — the authorizer declares what it can do (sign transactions, approve operations, etc.), and agents request specific actions
- **One-to-one pairing** — pair once with a short code or QR scan, like Bluetooth

## Use Cases

### Agent Wants to Run a Dangerous Operation

Your DevOps agent needs to delete expired records from the production database.

> **Phone notification:** "Maintenance Agent wants to DELETE 15,420 rows from `user_sessions`. Approve?"
>
> You review the details, tap **Approve** → Agent proceeds.

### Agent Needs API Access Authorization

Your research agent wants to call a paid API on your behalf.

> **Phone notification:** "Research Agent requests access to OpenAI API. Estimated cost: $5.00. Approve?"
>
> Looks right, tap **Approve** → Agent gets a one-time authorization token.

### Agent Wants to Sign a Crypto Transaction

Your trading agent spots an opportunity and wants to execute a swap on Uniswap.

> **Phone notification:** "Trading Agent wants to swap 1 ETH → USDC on Base. Estimated value: $3,200. Approve?"
>
> You check the details, tap **Approve** → Agent receives the signed transaction.

### Agent Asks for Any Permission You Define

Open-Auth is not limited to pre-defined actions. Any capability can be registered:

- File system access approval
- Email sending authorization
- Infrastructure changes (scaling, deployment)
- Financial operations beyond crypto

## How It Works

```
     One-time Setup                          Every Request
  ─────────────────────                ─────────────────────────────

  Agent              Phone             Agent              Phone
    │                  │                 │                  │
    │   Short code     │                 │  "authorize"     │
    │   or QR scan     │                 │  request (E2EE)  │
    │ ◄──────────────► │                 │ ───────────────► │
    │                  │                 │                  │
    │   Key exchange   │                 │                  │  User
    │   (X25519)       │                 │                  │  reviews
    │ ◄──────────────► │                 │                  │  & decides
    │                  │                 │                  │
    │   Paired! ✓      │                 │  result (E2EE)   │
    │                  │                 │ ◄─────────────── │
    │                  │                 │                  │
```

1. **Pair once** — Agent and your phone exchange keys via a short code or QR scan. This establishes an encrypted channel.
2. **Agent requests** — When the agent needs approval, it sends an encrypted request through a relay server.
3. **You decide** — Your phone shows what the agent wants to do. You approve, reject, or ignore.
4. **Agent gets the result** — If approved, the agent receives the result (a signature, a token, a simple "yes").

The relay server is a dumb pipe — it forwards encrypted messages without seeing their content.

## Protocol Architecture

Open-Auth is a 4-layer protocol stack:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Application                                        │
│  • capabilities query — "what can you do?"                   │
│  • authorize request — "please do X"                         │
│  • three-state response — approved / rejected / error        │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Security                                           │
│  • End-to-end encryption (X25519 + AES-256-GCM)             │
│  • Anti-replay protection                                    │
│  • Three-level reconnection verification                     │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Transport                                          │
│  • Three message types: pair_complete / handshake / encrypted│
│  • Transport-agnostic (HTTP relay, WebSocket, Bluetooth...)  │
├─────────────────────────────────────────────────────────────┤
│  Layer 0: Pairing                                            │
│  • Short code or QR code pairing                             │
│  • X25519 key exchange                                       │
│  • Deterministic channel ID derivation                       │
└─────────────────────────────────────────────────────────────┘
```

Full specifications: [`protocol/`](protocol/)

## The Capability Model

Open-Auth doesn't hardcode what agents can request. Instead, authorizers declare **capabilities** — named sets of actions they support.

```
authorize request:
{
  "method": "authorize",
  "capability": "evm-signer",           ← which capability
  "action": "sign_transaction",          ← which action
  "params": { "to": "0x...", ... },      ← action-specific params
  "context": {                           ← help the human decide
    "description": "Swap 1 ETH for USDC",
    "estimatedUSD": 3200
  }
}
```

**Built-in reference capabilities:**

| Capability | Actions | Description |
|------------|---------|-------------|
| `evm-signer` | `sign_transaction`, `sign_message`, `sign_typed_data` | EVM blockchain signing |
| `generic-approval` | `approve` | Human approval for any agent action |

Anyone can define new capabilities for their domain.

## Compatibility

Open-Auth is extracted from the [claw-wallet](https://github.com/anthropic/claw-wallet) project. It is fully backward-compatible:

- **claw-wallet Desktop** requires zero changes — it continues using its existing protocol
- **claw-wallet Agent SDK** can adopt Open-Auth for new authorizer connections while maintaining the legacy protocol for Desktop
- **The Go relay server** requires zero changes — it only routes opaque messages

See [`protocol/compatibility/claw-wallet.md`](protocol/compatibility/claw-wallet.md) for the full compatibility guide.

## Project Status

| Component | Status |
|-----------|--------|
| Protocol specification | ✅ v1.0 Draft complete |
| Mobile Authorizer (APP) | 🔜 Planned |
| Agent SDK | 🔜 Planned |
| Relay server | ♻️ Reusing claw-wallet relay |

## License

[MIT](LICENSE)
