import type { QuoteMeaning } from "@/types/quote";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestWindows = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: Request) {
  const clientId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!allowRequest(clientId)) {
    return Response.json({ error: "Please wait before requesting another interpretation." }, { status: 429 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AI interpretation is not configured." }, { status: 503 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const quote = readShortString(input, "quote", 600);
  const author = readShortString(input, "author", 120);
  if (!quote || !author) {
    return Response.json({ error: "A quote and author are required." }, { status: 400 });
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        temperature: 0.65,
        max_completion_tokens: 700,
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content: "You are Daybook, a warm and thoughtful literary guide. Explain quotes in accessible language without claiming one definitive interpretation. Do not invent facts about the author. Avoid medical, legal, diagnostic, or academic-sounding advice. Make every field useful, concise, and specific to the supplied quote.",
          },
          {
            role: "user",
            content: `Interpret this quote.\n\nQuote: ${JSON.stringify(quote)}\nAuthor: ${JSON.stringify(author)}\n\nThe simple meaning should be 1-2 sentences. The deeper meaning should be 2-3 sentences. The reflection must be one open-ended question.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "quote_meaning",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["title", "simple", "deeper", "reflection"],
              properties: {
                title: { type: "string", maxLength: 80 },
                simple: { type: "string", maxLength: 500 },
                deeper: { type: "string", maxLength: 800 },
                reflection: { type: "string", maxLength: 300 },
              },
            },
          },
        },
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });

    if (!response.ok) {
      const retryAfter = response.headers.get("retry-after");
      return Response.json(
        { error: response.status === 429 ? "The daily AI limit has been reached." : "The interpretation service is unavailable." },
        { status: response.status === 429 ? 429 : 502, headers: retryAfter ? { "Retry-After": retryAfter } : undefined },
      );
    }

    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned no content");
    const meaning = validateMeaning(JSON.parse(content));
    if (!meaning) throw new Error("Groq returned invalid content");

    return Response.json({ meaning, source: "groq" }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return Response.json({ error: timedOut ? "The interpretation request timed out." : "Could not generate an interpretation." }, { status: 502 });
  }
}

function readShortString(input: unknown, key: string, maxLength: number) {
  if (!input || typeof input !== "object") return null;
  const value = (input as Record<string, unknown>)[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : null;
}

function validateMeaning(value: unknown): QuoteMeaning | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const fields = ["title", "simple", "deeper", "reflection"] as const;
  if (!fields.every((field) => typeof candidate[field] === "string" && candidate[field].trim())) return null;
  return Object.fromEntries(fields.map((field) => [field, (candidate[field] as string).trim()])) as unknown as QuoteMeaning;
}

function allowRequest(clientId: string) {
  const now = Date.now();
  const current = requestWindows.get(clientId);
  if (!current || current.resetAt <= now) {
    requestWindows.set(clientId, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false;
  current.count += 1;
  return true;
}
