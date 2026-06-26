const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";

interface AICallParams {
  systemPrompt: string;
  prompt: string;
  responseFormat?: "json" | "text";
}

interface AICallResult {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export async function callAI(params: AICallParams): Promise<AICallResult | null> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;

  const model = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";

  try {
    const res = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: params.systemPrompt },
          { role: "user", content: params.prompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
        ...(params.responseFormat === "json"
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`[AI] NVIDIA API error ${res.status}: ${text}`);
      return null;
    }

    const data = await res.json();
    const msg = data.choices?.[0]?.message;
    if (!msg?.content) return null;

    return {
      content: msg.content,
      model: data.model || model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  } catch (err) {
    console.warn("[AI] NVIDIA API call failed:", err);
    return null;
  }
}

export function parseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
