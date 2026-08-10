import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createModelClient } from "./model-provider.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { maxHeaderSize } from "node:http";

const SYSTEM_PROMPT = `You are Mini Hack Assistant, a patient technical mentor for
Team1 Kenya's Cohort 3 builders. Explain concepts in plain English before
using jargon. Keep answers under 150 words unless asked for more detail.
Today's date is ${new Date().toDateString()}. Always use the current date
when writing search queries about news, prices, or anything time-sensitive.`;


const WEB_SEARCH_TOOL = {
  name: "web_search",
  description: "Search the web for current information. Use when the answer depends" + "on recent events, news, prices, or anything not in your training data.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string", description: "The search query"
      },
    },
    required: ["query"]
  },
};
async function webSearch(query) {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({ query, max_results: 5 }),
  });
  if (!response.ok) {
    throw new Error(`Tavily ${response.status}: ${await response.text()}`);
  }
  const data = await response.json();
  return data.results.map((r) => `${r.title}\n${r.url}\n${r.context}`).join("\n\n");



}
// avalanche mcp server
async function connectAvalancheMcp() {
  const url = process.env.Authorization || "https://build.avax.network/api/mcp";
  const mcp = new Client({
    name: "mini-hack-agent", version: "1.0.0"
  });
  await mcp.connect(new StreamableHTTPClientTransport(new URL(url)));

  const { tools } = await mcp.listTools();
  const toolDefs = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema
  }));
  return { mcp,toolDefs };
}

// tool dispatch

async function runTool(mcp, mcpToolNames, name, input) {
  try {
    if (name == "web_search") return await webSearch(input.query);
    if (mcpToolNames.has(name)) {
      const result = await mcp.callTool({ name, arguments: input });
      return result.content.map((block) => block.text ?? "").join("\n");
    }
    return `unknown tool: ${name}`;
  } catch (err) {
    return `error: ${err.message}`;
  }
}
const { mcp, toolDefs } = await connectAvalancheMcp();
const tools = [WEB_SEARCH_TOOL, ...toolDefs];
const mcpToolNames = new Set(toolDefs.map((t) => t.name));
console.log(`Tools ready: ${tools.map((t) => t.name).join(", ")}\n`);
;

async function main() {
  const rl = readline.createInterface({ input, output });
  const messages = [];

  // Provider is read from MODEL_PROVIDER in .env, defaulting to "anthropic"
  // if that's not set. Override for a single run without touching .env:
  //   MODEL_PROVIDER=openai npm start
  // Or force it in code instead: createModelClient("openai")
  const client = await createModelClient();
  console.log(
    `Mini Hack CLI Chatbot using ${client.provider} — type 'exit' to quit\n`,
  );
  console.log(`Using model provider: ${client.provider}\n`);

  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput.trim().toLowerCase() === "exit") break;

    messages.push({ role: "user", content: userInput });

    while (true) {
      let reply;
      try {
        reply = await client.generateText({
          systemPrompt: SYSTEM_PROMPT,
          messages,
          tools,
        });
      } catch (err) {
        console.error(`\nAPI error: ${err.message}\n`);
        break;
      }
      if (reply.stopReason == "tool_use") {
        console.log(`\nAssistant: ${reply.text}\n`);
        messages.push({ role: "assistant", content: reply.text });
      } else {
        console.log(`\nAssistant: ${reply.text}\n`);
        messages.push({ role: "assistant", content: reply.text });
        break;
      }
      messages.push({ role: "assistant", content: reply.raw.content });

      const results = [];
      for (const call of reply.toolCalls) {
        console.log(` [tool] ${call.name} ${JSON.stringify(call.input)} `);
        const output = await runTool(mcp, mcpToolNames, call.name, call.input);
        results.push({ type: "tool_result", tool_use_id: call.id, content: output, });
      }
      messages.push({ role: "user", content: results });
    }
    await mcp.close();
    rl.close();
  }
}

main().catch((err) => {
  console.error("Agent error:", err.message);
  process.exit(1);
});
