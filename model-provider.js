const SUPPORTED_PROVIDERS = ["anthropic", "openai", "gemini", "ollama"];

function getConfiguredProvider() {
  const provider =
    process.env.MODEL_PROVIDER?.trim().toLowerCase() || "anthropic";

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error(
      `Unsupported MODEL_PROVIDER "${provider}". Use one of: ${SUPPORTED_PROVIDERS.join(", ")}`,
    );
  }

  return provider;
}

function extractText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(extractText).filter(Boolean).join("\n");
  }

  if (!value || typeof value !== "object") return "";

  if (typeof value.text === "string") return value.text;
  if (typeof value.content === "string") return value.content;
  if (Array.isArray(value.content))
    return value.content.map(extractText).filter(Boolean).join("\n");
  if (typeof value.message?.content === "string") return value.message.content;
  if (Array.isArray(value.message?.content)) {
    return value.message.content.map(extractText).filter(Boolean).join("\n");
  }

  return "";
}

function normalizeResponse(response) {
  if (typeof response === "string") return response;

  const candidates = [
    response?.content,
    response?.choices?.[0]?.message?.content,
    response?.message?.content,
    response?.text,
    response?.result,
    response?.reply,
    response?.response,
  ];

  for (const candidate of candidates) {
    const text = extractText(candidate);
    if (text) return text;
  }

  throw new Error("Unable to extract text from model response.");
}

async function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  return {
    provider: "anthropic",
    async generateText({ systemPrompt, messages }) {
      const response = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: Number(process.env.MAX_TOKENS || 1024),
        system: systemPrompt,
        messages,
      });

      return normalizeResponse(response);
    },
  };
}

async function createOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });

  return {
    provider: "openai",
    async generateText({ systemPrompt, messages }) {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1",
        max_tokens: Number(process.env.MAX_TOKENS || 1024),
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      });

      return normalizeResponse(response);
    },
  };
}

async function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey });

  return {
    provider: "gemini",
    async generateText({ systemPrompt, messages }) {
      const response = await client.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        config: { systemInstruction: systemPrompt },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
      });

      return normalizeResponse(response);
    },
  };
}

async function createOllamaClient() {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.1";

  return {
    provider: "ollama",
    async generateText({ systemPrompt, messages }) {
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed with status ${response.status}`);
      }

      const data = await response.json();
      return normalizeResponse(data);
    },
  };
}

export async function createModelClient(providerOverride) {
  const provider =
    providerOverride?.trim().toLowerCase() || getConfiguredProvider();

  switch (provider) {
    case "anthropic":
      return createAnthropicClient();
    case "openai":
      return createOpenAIClient();
    case "gemini":
      return createGeminiClient();
    case "ollama":
      return createOllamaClient();
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export { SUPPORTED_PROVIDERS, normalizeResponse, extractText };
