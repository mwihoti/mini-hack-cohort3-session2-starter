# Mini Hack Starter — Rust Edition

This folder is the Rust twin of `chat.js`: the same Session 1 CLI chatbot —
one system prompt, one growing message history, one loop — written in plain
Rust. Everything the [main README](../README.md) says about how the
conversation memory works applies here unchanged; this file only covers
what's different because you're in Rust.

## Why there's no SDK in here

There is no official Anthropic SDK for Rust, so `chat.rs` calls the
Messages API directly: an HTTPS POST with three headers and a JSON body.
That's genuinely all an "AI client" is, and seeing it raw is the point —
when you later use an SDK in any language, you'll know exactly what it's
doing for you.

```
POST https://api.anthropic.com/v1/messages
  x-api-key: <your key>
  anthropic-version: 2023-06-01
  content-type: application/json

{ "model": ..., "max_tokens": ..., "system": ..., "messages": [ ... ] }
```

## Setup

```bash
# 1. Rust toolchain, if you don't have one — https://rustup.rs
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. API key goes in the REPO ROOT .env, same file chat.js uses
cd ..
cp .env.example .env   # paste your key from console.anthropic.com

# 3. Build and run
cd rust
cargo run
```

You can also run it from the repo root with
`cargo run --manifest-path rust/Cargo.toml`. Either way the repo-root
`.env` is found — `dotenvy` walks up parent directories looking for it.

The same variables `chat.js` honors work here too:

| Variable | Default | Meaning |
|---|---|---|
| `ANTHROPIC_API_KEY` | *(required)* | Your key from console.anthropic.com |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Which Claude model to call |
| `MAX_TOKENS` | `1024` | Cap on each reply — raise it if replies look cut off |

## How this maps to the JS starter

| In `chat.js` / `model-provider.js` | In `chat.rs` |
|---|---|
| `SYSTEM_PROMPT` | `SYSTEM_PROMPT` — identical text |
| `const messages = []` | `let mut messages: Vec<Message>` |
| `client.generateText({...})` | `send_message(...)` — the raw HTTP POST |
| `reply.text` | `reply.text()` — first `"text"` block in `content` |
| `reply.stopReason` | `reply.stop_reason` |
| `reply.raw` | `ApiResponse` — you already hold the parsed response |

## Tonight's deliverable, in Rust

The Week 1 task is the same as on the JS side: give the agent a web search
tool and the Avalanche MCP server's `docs_search`. The tool loop hooks into
`chat.rs` at the `stop_reason` check. What you'll need to change:

1. **Declare tools** — add a `"tools": [...]` field to the request body in
   `send_message`. Each tool is `{ "name", "description", "input_schema" }`
   where `input_schema` is JSON Schema.
2. **Detect tool calls** — when `stop_reason` is `"tool_use"`, the
   `content` array holds blocks with `"type": "tool_use"` carrying an
   `id`, `name`, and `input`. Extend `ContentBlock` with those fields
   (they're absent on text blocks, so make them `Option`s or use
   `serde_json::Value`).
3. **Echo the assistant turn back verbatim** — the `tool_use` blocks must
   survive in history. The easiest path is switching `Message.content`
   from `String` to `serde_json::Value` so a turn can be either a plain
   string or the raw block array.
4. **Return results as a user turn** — push
   `{ "role": "user", "content": [{ "type": "tool_result",
   "tool_use_id": <id from step 2>, "content": <result string> }] }`
   and call the API again. Loop until `stop_reason` is `"end_turn"`.
5. **Wrap every tool call in error handling** — return the error message
   as the tool result instead of crashing, so the model can recover.
   (Same rule as `CONTRIBUTING.md` sets for the JS side.)

You already have `ureq` for the web search tool's own HTTP calls — Tavily
and Brave both have free tiers with simple JSON APIs.

## Common issues

| Problem | Likely cause |
|---|---|
| `cargo: command not found` | No toolchain — install via rustup, then reopen your shell |
| `ANTHROPIC_API_KEY is not set.` | `.env` is missing at the **repo root**, or the key line has quotes/spaces around it |
| `API returned 401: ...` | The key itself is wrong or revoked — the body printed after the code is Anthropic's own explanation |
| `API returned 429: ...` | Rate limited — wait a moment between messages |
| Reply looks cut off | You hit `MAX_TOKENS` — the program warns when this happens; raise it in `.env` |
| Compile errors on `let ... else` | Old toolchain — run `rustup update` (needs Rust 1.65+) |

Submission flow — branch naming, testing, screenshots, the X post, the PR —
is identical to the JS side: see [`CONTRIBUTING.md`](../CONTRIBUTING.md)
and [`COMMANDS.md`](../COMMANDS.md).
