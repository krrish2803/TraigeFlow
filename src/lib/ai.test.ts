import { describe, it, expect, vi, beforeEach } from "vitest";
import { callAI } from "./ai";

const originalEnv = { ...process.env };

describe("callAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, NVIDIA_API_KEY: "test-key" };
  });

  it("returns null when Nvidia key is missing", async () => {
    delete process.env.NVIDIA_API_KEY;
    const result = await callAI({ systemPrompt: "", prompt: "test", responseFormat: "json" });
    expect(result).toBeNull();
  });

  it("makes fetch call and returns response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: JSON.stringify({ key: "value" }) } }],
        model: "meta/llama-3.1-8b-instruct",
      }),
    });

    const result = await callAI({ systemPrompt: "sys", prompt: "test prompt", responseFormat: "json" });
    expect(result).not.toBeNull();
    expect(result!.content).toBe(JSON.stringify({ key: "value" }));
    expect(result!.model).toBeTruthy();
    expect(result!.usage).toBeDefined();
  });

  it("returns null on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve("Rate limited"),
    });

    const result = await callAI({ systemPrompt: "", prompt: "test", responseFormat: "json" });
    expect(result).toBeNull();
  });

  it("returns null on network error", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await callAI({ systemPrompt: "", prompt: "test", responseFormat: "json" });
    expect(result).toBeNull();
  });

  it("returns null when choices array is empty", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [] }),
    });

    const result = await callAI({ systemPrompt: "", prompt: "test", responseFormat: "json" });
    expect(result).toBeNull();
  });

  it("returns null when response has no content", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "" } }] }),
    });

    const result = await callAI({ systemPrompt: "", prompt: "test", responseFormat: "json" });
    expect(result).toBeNull();
  });
});
