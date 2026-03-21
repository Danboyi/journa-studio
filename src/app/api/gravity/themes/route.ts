import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { env, hasAnthropic } from "@/config/env";
import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";

export interface GravityTheme {
  tension:     string;
  description: string;
  weight:      "rising" | "stable" | "fading";
  evolution:   string;
  entryCount:  number;
}

function buildGravityPrompt(entries: Array<{ headline: string; body: string; created_at: string }>) {
  const formatted = entries
    .slice(0, 30)
    .map((e, i) => {
      const date = new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const text = [e.headline, e.body].filter(Boolean).join(" — ");
      return `[${i + 1}] ${date}: ${text.slice(0, 400)}`;
    })
    .join("\n\n");

  return `You are reading someone's private journal entries in chronological order (newest first).

Your task: identify the 3–5 deepest TENSIONS this person keeps returning to. Not topics. Not emotions. TENSIONS — the unresolved pulls between two opposing forces that are shaping their inner life.

Examples of tensions (specific, evocative):
- "recognition vs. the fear of being truly seen"
- "the need to leave vs. the terror of starting over"
- "intimacy and the distance they keep"
- "ambition and the exhaustion it hides"
- "belonging without losing oneself"

Examples of what NOT to return (too generic):
- "work/life balance" — too corporate
- "stress" — emotion, not tension
- "relationships" — topic, not tension

For each tension, return:
- tension: 4–8 words, specific to THEIR writing voice, not generic
- description: exactly one sentence about what this looks like across their entries
- weight: "rising" if it appears more in recent entries, "fading" if older entries, "stable" otherwise
- evolution: one sentence — how their relationship to this tension has shifted over time (if visible)
- entryCount: approximate count of entries that touch this theme

Be literary, honest, precise. These should feel like a revelation — something they've felt but haven't named.

---

JOURNAL ENTRIES (newest first):

${formatted}`;
}

// Fallback themes for demo mode or when AI is unavailable
function getDemoThemes(): GravityTheme[] {
  return [
    {
      tension:     "Wanting to be known without being seen",
      description: "You write about connection while describing the ways you keep people at a careful distance.",
      weight:      "rising",
      evolution:   "Recently, the distance feels more like protection than preference.",
      entryCount:  8,
    },
    {
      tension:     "Moving forward vs. what you'd leave behind",
      description: "Change keeps appearing in your writing — but so does a subtle grief for the version of yourself you'd be letting go.",
      weight:      "stable",
      evolution:   "The pull toward what's ahead is growing louder, even as you keep looking back.",
      entryCount:  6,
    },
    {
      tension:     "Ambition and the rest underneath it",
      description: "Your drive surfaces often, but so does a quieter note — something that wonders if all this striving is covering something else.",
      weight:      "fading",
      evolution:   "You seem to be making peace with wanting less, or wanting differently.",
      entryCount:  5,
    },
  ];
}

export async function GET(request: NextRequest) {
  const accessToken = getAccessToken(request);

  if (!accessToken) {
    return NextResponse.json({ error: "Missing session token." }, { status: 401 });
  }

  const supabase = createSupabaseUserClient(accessToken);

  if (!supabase) {
    return NextResponse.json({ themes: getDemoThemes(), source: "demo" });
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  const { data: entries, error: entriesError } = await supabase
    .from("journal_entries")
    .select("id, headline, body, mood, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (entriesError || !entries) {
    return NextResponse.json({ error: "Could not load entries." }, { status: 400 });
  }

  // Need at least 5 entries to produce meaningful themes
  if (entries.length < 5) {
    return NextResponse.json({ themes: [], insufficient: true, entryCount: entries.length });
  }

  // Use AI if available, otherwise demo
  if (!hasAnthropic) {
    return NextResponse.json({ themes: getDemoThemes(), source: "demo" });
  }

  try {
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model:      env.ANTHROPIC_REFLECTION_MODEL,
      max_tokens: 2048,
      tools: [
        {
          name:        "gravity_themes",
          description: "Return the gravity themes (tensions) extracted from the journal entries.",
          input_schema: {
            type:     "object" as const,
            required: ["themes"],
            properties: {
              themes: {
                type: "array",
                items: {
                  type:     "object",
                  required: ["tension", "description", "weight", "evolution", "entryCount"],
                  properties: {
                    tension:     { type: "string" },
                    description: { type: "string" },
                    weight:      { type: "string", enum: ["rising", "stable", "fading"] },
                    evolution:   { type: "string" },
                    entryCount:  { type: "number" },
                  },
                },
              },
            },
          },
        },
      ],
      tool_choice: { type: "tool", name: "gravity_themes" },
      messages: [{ role: "user", content: buildGravityPrompt(entries) }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");

    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ themes: getDemoThemes(), source: "demo" });
    }

    const { themes } = toolUse.input as { themes: GravityTheme[] };

    // Validate shape
    const valid = (themes ?? []).filter(
      (t) =>
        typeof t.tension === "string" &&
        typeof t.description === "string" &&
        ["rising", "stable", "fading"].includes(t.weight),
    );

    return NextResponse.json({ themes: valid, source: "ai" });
  } catch {
    return NextResponse.json({ themes: getDemoThemes(), source: "demo" });
  }
}
