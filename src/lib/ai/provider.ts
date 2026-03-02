import OpenAI from "openai";

import { env, hasOpenAI } from "@/config/env";
import { composeDraft } from "@/lib/demo-composer";
import { buildComposePrompt } from "@/lib/ai/prompt";
import {
  composeResponseJsonSchema,
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
    const response = await this.client.responses.create({
      model: env.OPENAI_MODEL,
      input: buildComposePrompt(input),
      temperature: 0.8,
      text: {
        format: {
          type: "json_schema",
          name: "compose_response",
          strict: true,
          schema: composeResponseJsonSchema,
        },
      },
    });

    const text = response.output_text;

    let parsed: unknown;

    try {
      parsed = JSON.parse(text);
    } catch {
      return composeResponseSchema.parse(composeDraft(input));
    }

    return composeResponseSchema.parse(parsed);
  }
}

export function getComposeProvider(): ComposeProvider {
  if (hasOpenAI) {
    return new OpenAIComposeProvider();
  }

  return new DemoComposeProvider();
}
