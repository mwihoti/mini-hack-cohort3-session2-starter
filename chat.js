import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// ─────────────────────────────────────────────────────────────────────────
// MODEL PROVIDER
//
// This starter uses Claude by default. You are NOT locked into Claude —
// Mini Hack cares about you understanding the agent pattern (system prompt,
// conversation history, one client, one call), not which company made the
// model. Commented-out blocks below show the same chatbot wired to other
// providers. To switch: comment out the ACTIVE block, uncomment the
// provider you want, install its SDK, and add its key to .env.
// ─────────────────────────────────────────────────────────────────────────

// ── ACTIVE: Anthropic Claude ────────────────────────────────────────────
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;

async function callModel(systemPrompt, messages) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages, // full history sent every turn — Claude has no memory of its own
  });
  return response.content[0].text;
}

// ── ALTERNATIVE: OpenAI (GPT models) ────────────────────────────────────
// npm install openai
// Add OPENAI_API_KEY to your .env, then uncomment this block and comment
// out the Anthropic block above (imports, client, MODEL/MAX_TOKENS, and
// callModel). OpenAI's chat format takes the system prompt as a message
// inside the array instead of a separate field.
//
// import OpenAI from "openai";
//
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// const MODEL = "gpt-4.1";
//
// async function callModel(systemPrompt, messages) {
//   const response = await openai.chat.completions.create({
//     model: MODEL,
//     max_tokens: 1024,
//     messages: [{ role: "system", content: systemPrompt }, ...messages],
//   });
//   return response.choices[0].message.content;
// }

// ── ALTERNATIVE: Google Gemini ──────────────────────────────────────────
// npm install @google/genai
// Add GEMINI_API_KEY to your .env, then uncomment this block and comment
// out the Anthropic block above.
//
// import { GoogleGenAI } from "@google/genai";
//
// const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// const MODEL = "gemini-2.5-flash";
//
// async function callModel(systemPrompt, messages) {
//   const response = await genAI.models.generateContent({
//     model: MODEL,
//     config: { systemInstruction: systemPrompt },
//     contents: messages.map((m) => ({
//       role: m.role === "assistant" ? "model" : "user",
//       parts: [{ text: m.content }],
//     })),
//   });
//   return response.text;
// }

// ── ALTERNATIVE: Local models via Ollama (no API key, runs on your machine) ─
// Install Ollama from ollama.com, then: ollama pull llama3.1
// Uncomment this block and comment out the Anthropic block above.
//
// const MODEL = "llama3.1";
//
// async function callModel(systemPrompt, messages) {
//   const res = await fetch("http://localhost:11434/api/chat", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       model: MODEL,
//       stream: false,
//       messages: [{ role: "system", content: systemPrompt }, ...messages],
//     }),
//   });
//   const data = await res.json();
//   return data.message.content;
// }

// ─────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Mini Hack Assistant, a patient technical mentor for
Team1 Kenya's Cohort 3 builders. Explain concepts in plain English before
using jargon. Keep answers under 150 words unless asked for more detail.`;

async function main() {
  const rl = readline.createInterface({ input, output });
  const messages = []; // conversation history lives here, in memory only

  console.log("Mini Hack CLI Chatbot — type 'exit' to quit\n");

  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput.trim().toLowerCase() === "exit") break;

    messages.push({ role: "user", content: userInput });

    const reply = await callModel(SYSTEM_PROMPT, messages);
    console.log(`\nAssistant: ${reply}\n`); // generic label — stays correct if you switch providers

    messages.push({ role: "assistant", content: reply }); // remember the model's turn too
  }

  rl.close();
}

main().catch((err) => {
  console.error("Agent error:", err.message);
  process.exit(1);
});
