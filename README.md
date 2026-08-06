# Mini Hack — Cohort 3, Session 2 Starter

**Building Agentic Solutions on Avalanche** · Team1 Kenya

This is where Session 2 starts from. Session 1 left every builder with a
CLI chatbot that holds a real conversation — it remembers everything said
so far, turn after turn, for as long as the program keeps running.
`chat.js` in this repo is exactly that: your Session 1 output, ready to
build on.

Session 2 starts here and adds tools — a web search tool, then the
Avalanche MCP server — turning this from something that only answers
into something that can act. That's the two-tool agent and the MCP
integration you're live-coding tonight, on top of this exact file.

If you've never called an AI API before in your life, this is still
exactly where you should be. Nothing here assumes you caught Session 1.

## What this starter actually does, right now

Run `chat.js` and you get a terminal program that:

- Asks you for a message, sends it to an LLM, and prints the reply
- Remembers every message you and the model have exchanged, and resends
  that whole history on every single call — this is *how* an LLM appears
  to have memory, even though the model itself is stateless between calls
- Uses a system prompt to give the model a consistent persona and rules,
  set once at the top of the file, applied to every turn
- Keeps looping until you type `exit`, then shuts down cleanly

Under sixty lines of code, and every line of it matters — there's no
hidden framework doing the "agent" part for you. This is the whole
pattern: one client, one system prompt, one array holding history, one
loop. Tonight you extend that same loop so it can call tools.

## How the conversation memory actually works

This trips people up the first time, so it's worth spelling out. The
model has no memory of its own — every API call is completely
independent. What makes this feel like a continuous conversation is:

1. Every message you type gets pushed into a `messages` array
2. Every reply from the model gets pushed into that same array too
3. On your *next* message, the entire array — the full history — gets
   sent again, not just your newest line
4. The model reads the whole thing fresh each time and replies as if it
   remembers, because from its point of view, it's reading a transcript
   that includes everything

That's the entire trick. No database, no session store — just an array
in memory that grows for as long as the program runs, and gets sent back
in full every time. Tonight's tool calls slot into this same array, as
extra turns in that history — the mechanism doesn't change, it just
carries more kinds of content.

## Model provider

Claude is the **active default** — that's what runs out of the box. You
are not locked into it. `chat.js` includes three additional, fully
written, ready-to-run blocks, commented out directly in the file:

| Provider | What you need | Runs where |
|---|---|---|
| **Claude (active)** | `ANTHROPIC_API_KEY` from console.anthropic.com | Anthropic's servers |
| OpenAI (GPT) | `npm install openai` + `OPENAI_API_KEY` | OpenAI's servers |
| Google Gemini | `npm install @google/genai` + `GEMINI_API_KEY` | Google's servers |
| Ollama (local) | Install Ollama, `ollama pull llama3.1` | Your own machine, no API key |

To switch: comment out the active Anthropic block in `chat.js`, uncomment
the provider you want, install its SDK if it needs one, and add its key
to `.env`. Everything else in the file — the loop, the memory array, the
system prompt — stays exactly the same, and so does everything you add
tonight, because tool use isn't specific to one provider either.

## Setup

```bash
npm install
cp .env.example .env
# paste your key from console.anthropic.com into .env
npm start
```

You should see:

```
Mini Hack CLI Chatbot — type 'exit' to quit

You: 
```

Type a message and press enter. To end the session, type `exit`.

## Files

| File | Purpose |
|---|---|
| `chat.js` | Your Session 1 chatbot — client setup, system prompt, conversation loop. Claude active by default, OpenAI/Gemini/Ollama included commented out. This is what you extend tonight |
| `.env.example` | Template for your API key(s) — copy to `.env`, never commit `.env` |
| `package.json` | Dependencies for the active provider: `@anthropic-ai/sdk`, `dotenv` |
| `COMMANDS.md` | Every command you need, copy-paste ready, from clone to PR |
| `CONTRIBUTING.md` | The full submission flow — branching, testing, screenshots, the X post, and the PR |
| `docs/PULL_REQUEST_TEMPLATE.md` | What your PR description needs to cover |

## Tonight: your Week 1 deliverable

Extend `chat.js` (or build alongside it) so your agent can call **two
tools**: a web search tool, and the Avalanche MCP server (`docs_search`
at minimum). We build both live, together, on top of this file. See
`COMMANDS.md` for the exact commands and `CONTRIBUTING.md` for how
to submit: testing, screenshots, the X post, and the PR are all covered
there.

## Common issues

| Problem | Likely cause |
|---|---|
| `401` / invalid API key | `.env` isn't loading, or the key has extra quotes/spaces around it |
| `429` / rate limited | Sending requests too fast — wait a moment, or add retry logic |
| Reply looks cut off | You've hit the token limit — raise `MAX_TOKENS` or shorten your prompt |
| "Cannot find module" | Run `npm install` again — did you switch providers without installing their SDK? |
| Tool loop never ends | Check you're testing `stop_reason` correctly and pushing `tool_result` back into `messages` |

## Cost awareness

Every message you send and receive costs tokens, and tool calls add extra
round trips on top of that. Check your usage at
console.anthropic.com/settings/usage before and after a session so you know
what a typical session costs, and set a spend limit under Settings → Limits.
