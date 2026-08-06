import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createModelClient } from "./model-provider.js";

const SYSTEM_PROMPT = `You are Mini Hack Assistant, a patient technical mentor for
Team1 Kenya's Cohort 3 builders. Explain concepts in plain English before
using jargon. Keep answers under 150 words unless asked for more detail.`;

async function main() {
  const rl = readline.createInterface({ input, output });
  const messages = [];

  // configure the provider you have api keys for
  const client = await createModelClient("openai"); // or "gemini" or "ollama"
  console.log(
    `Mini Hack CLI Chatbot using ${client.provider} — type 'exit' to quit\n`,
  );
  console.log(`Using model provider: ${client.provider}\n`);

  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput.trim().toLowerCase() === "exit") break;

    messages.push({ role: "user", content: userInput });

    const reply = await client.generateText({
      systemPrompt: SYSTEM_PROMPT,
      messages,
    });
    console.log(`\nAssistant: ${reply}\n`);

    messages.push({ role: "assistant", content: reply });
  }

  rl.close();
}

main().catch((err) => {
  console.error("Agent error:", err.message);
  process.exit(1);
});
