import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

import { env, hasOpenAI, hasAnthropic } from "@/config/env";
import { composeDraft } from "@/lib/demo-composer";
import { buildComposePrompt } from "@/lib/ai/prompt";
import {
  composeResponseSchema,
  type ComposeRequestInput,
  type ComposeResponseOutput,
} from "@/lib/ai/schema";

interface ComposeProvider {
  compose(input: ComposeRequestInput): Promise<ComposeResponseOutput>;
}

class DemoComposeProvider implements ComposeProvider {
  async compose(input: ComposeRequestInput): Promise<ComposeResponseOutput> {
    return composeResponseSchema.parse(composeDraft(input));
  }
}

class OpenAIComposeProvider implements ComposeProvider {
  private client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  async compose(input: ComposeRequestInput): Promise<ComposeResponseOutput> {
    const { composeResponseJsonSchema } = await import("@/lib/ai/schema");

    const completion = await this.client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [{ role: "user", content: buildComposePrompt(input) }],
      temperature: 0.8,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "compose_response",
          strict: true,
          schema: composeResponseJsonSchema,
        },
      },
    });

    const text = completion.choices[0]?.message?.content ?? "";

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return composeResponseSchema.parse(composeDraft(input));
    }

    return composeResponseSchema.parse(parsed);
  }
}

class ClaudeComposeProvider implements ComposeProvider {
  private client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  async compose(input: ComposeRequestInput): Promise<ComposeResponseOutput> {
    const response = await this.client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: 4096,
      tools: [
        {
          name: "compose_response",
          description:
            "Return the composition result with title, excerpt, draft, editorialNotes, and reflection.",
          input_schema: {
            type: "object" as const,
            required: ["title", "excerpt", "draft", "editorialNotes"],
            properties: {
              title: { type: "string" },
              excerpt: { type: "string" },
              draft: { type: "string" },
              editorialNotes: {
                type: "array",
                items: { type: "string" },
              },
              reflection: {
                type: "object",
                required: ["summary", "whatMattered", "beneathTheSurface", "followUpQuestion"],
                properties: {
                  summary: { type: "string" },
                  whatMattered: { type: "string" },
                  beneathTheSurface: { type: "string" },
                  followUpQuestion: { type: "string" },
                },
              },
            },
          },
        },
      ],
      tool_choice: { type: "tool", name: "compose_response" },
      messages: [{ role: "user", content: buildComposePrompt(input) }],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");

    if (!toolUse || toolUse.type !== "tool_use") {
      return composeResponseSchema.parse(composeDraft(input));
    }

    return composeResponseSchema.parse(toolUse.input);
  }
}

export function getComposeProvider(): ComposeProvider {
  const requested = env.AI_PROVIDER;

  if (requested === "claude" && hasAnthropic) return new ClaudeComposeProvider();
  if (requested === "openai" && hasOpenAI) return new OpenAIComposeProvider();
  if (requested === "demo") return new DemoComposeProvider();

  // Auto-select: prefer Claude, fall back to OpenAI, then demo
  if (hasAnthropic) return new ClaudeComposeProvider();
  if (hasOpenAI) return new OpenAIComposeProvider();
  return new DemoComposeProvider();
}
