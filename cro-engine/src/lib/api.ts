import { MODEL } from "./constants";

const API_URL = "https://api.anthropic.com/v1/messages";
const MAX_CONCURRENT = 5;
const DELAY_MS = 2000;

let activeRequests = 0;
const queue: Array<() => void> = [];

function dequeue() {
  if (queue.length > 0 && activeRequests < MAX_CONCURRENT) {
    const next = queue.shift()!;
    next();
  }
}

async function rateLimitedFetch(
  apiKey: string,
  system: string,
  userContent: string,
  maxTokens: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const execute = async () => {
      activeRequests++;
      try {
        const res = await fetch(API_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: maxTokens,
            system,
            messages: [{ role: "user", content: userContent }],
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`API error ${res.status}: ${err}`);
        }

        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        resolve(text);
      } catch (e) {
        reject(e);
      } finally {
        activeRequests--;
        setTimeout(dequeue, DELAY_MS);
      }
    };

    if (activeRequests < MAX_CONCURRENT) {
      execute();
    } else {
      queue.push(execute);
    }
  });
}

export function parseJsonResponse(text: string): unknown {
  // Try direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Extract from markdown code block
    const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1].trim());
    }
    throw new Error("Could not parse JSON from response");
  }
}

export async function callClaude(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096
): Promise<string> {
  return rateLimitedFetch(apiKey, systemPrompt, userPrompt, maxTokens);
}
