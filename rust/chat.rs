// chat.rs — the Rust twin of chat.js, for builders who'd rather onboard in Rust.
//
// Same program, same lesson: one client, one system prompt, one Vec holding
// the whole conversation, one loop. There's no official Anthropic SDK for
// Rust, and that's fine — the Messages API is just JSON over HTTPS, and
// seeing it raw is worth more than an SDK would hide. Every request sends
// the FULL history in `messages`; the model is stateless and re-reads the
// whole transcript each turn. That's the entire memory trick.
//
// Run it:
//   1. Install a toolchain from https://rustup.rs
//   2. At the repo root: cp .env.example .env   (same ANTHROPIC_API_KEY as chat.js)
//   3. cd rust && cargo run
//
// This file talks to Anthropic only — the MODEL_PROVIDER switch lives on the
// JS side in model-provider.js. Tonight's tool-calling work slots in where
// `stop_reason` is read below: a "tool_use" stop means run the tool, push
// the result back into `messages`, and call the API again.

use serde::{Deserialize, Serialize};
use serde_json::json;
use std::error::Error;
use std::io::{self, Write};

const API_URL: &str = "https://api.anthropic.com/v1/messages";

const SYSTEM_PROMPT: &str = "You are Mini Hack Assistant, a patient technical mentor for
Team1 Kenya's Cohort 3 builders. Explain concepts in plain English before
using jargon. Keep answers under 150 words unless asked for more detail.";

// One turn of the conversation. The API accepts plain-string content, so the
// starter keeps it that way; tool calls later need block arrays instead.
#[derive(Serialize)]
struct Message {
    role: String, // "user" or "assistant"
    content: String,
}

// Just the response fields we need — serde ignores the rest.
#[derive(Deserialize)]
struct ApiResponse {
    content: Vec<ContentBlock>,
    stop_reason: Option<String>,
}

#[derive(Deserialize)]
struct ContentBlock {
    #[serde(rename = "type")]
    kind: String, // "text" for now; "tool_use" once you add tools
    #[serde(default)]
    text: String,
}

impl ApiResponse {
    // The assistant's reply text ("" if the model sent no text block).
    fn text(&self) -> String {
        self.content
            .iter()
            .find(|block| block.kind == "text")
            .map(|block| block.text.clone())
            .unwrap_or_default()
    }
}

fn main() {
    if let Err(err) = run() {
        eprintln!("Agent error: {err}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), Box<dyn Error>> {
    // Load .env into real environment variables; a missing file is fine.
    // dotenvy walks up parent directories, so the repo-root .env is found
    // even though this program runs from rust/.
    let _ = dotenvy::dotenv();

    let api_key =
        std::env::var("ANTHROPIC_API_KEY").map_err(|_| "ANTHROPIC_API_KEY is not set.")?;
    // Same defaults as model-provider.js, so both starters behave alike.
    let model =
        std::env::var("ANTHROPIC_MODEL").unwrap_or_else(|_| "claude-sonnet-4-6".to_string());
    let max_tokens: u32 = std::env::var("MAX_TOKENS")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(1024);

    let mut messages: Vec<Message> = Vec::new();

    println!("Mini Hack CLI Chatbot (Rust) — type 'exit' to quit\n");

    loop {
        // None means stdin closed (Ctrl-D) — treat it like "exit".
        let Some(user_input) = ask("You: ")? else {
            println!();
            break;
        };
        let trimmed = user_input.trim();
        if trimmed.eq_ignore_ascii_case("exit") {
            break;
        }
        if trimmed.is_empty() {
            continue; // the API rejects empty messages
        }

        messages.push(Message {
            role: "user".to_string(),
            content: user_input,
        });

        let reply = send_message(&api_key, &model, max_tokens, &messages)?;
        let text = reply.text();
        println!("\nAssistant: {text}\n");
        if reply.stop_reason.as_deref() == Some("max_tokens") {
            eprintln!("(reply hit the token limit — raise MAX_TOKENS in .env)\n");
        }

        messages.push(Message {
            role: "assistant".to_string(),
            content: text,
        });
    }

    Ok(())
}

// Print a prompt, read one line. Ok(None) on end-of-input.
fn ask(prompt: &str) -> io::Result<Option<String>> {
    print!("{prompt}");
    io::stdout().flush()?;
    let mut line = String::new();
    if io::stdin().read_line(&mut line)? == 0 {
        return Ok(None);
    }
    Ok(Some(line.trim_end().to_string()))
}

// One API call: POST the system prompt plus the full history, parse the reply.
fn send_message(
    api_key: &str,
    model: &str,
    max_tokens: u32,
    messages: &[Message],
) -> Result<ApiResponse, Box<dyn Error>> {
    let result = ureq::post(API_URL)
        .set("x-api-key", api_key)
        .set("anthropic-version", "2023-06-01")
        .send_json(json!({
            "model": model,
            "max_tokens": max_tokens,
            "system": SYSTEM_PROMPT,
            "messages": messages,
        }));

    let response = match result {
        Ok(response) => response,
        // Non-2xx: the API's own error body names the real problem (bad key,
        // unknown model, rate limit) better than we could guess here.
        Err(ureq::Error::Status(code, response)) => {
            let body = response.into_string().unwrap_or_default();
            return Err(format!("API returned {code}: {body}").into());
        }
        Err(err) => return Err(err.into()),
    };

    Ok(response.into_json()?)
}
