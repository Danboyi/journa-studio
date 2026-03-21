import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

/**
 * Generates smart, pattern-aware nudges for the journal page.
 * No AI call — pure data analysis to keep it free & fast.
 */

const STOP_WORDS = new Set([
  "the","and","that","have","with","this","from","your","about","there","their","would","could","should",
  "into","because","while","where","when","what","which","were","been","after","before","still","very",
  "just","than","then","them","they","felt","feel","even","only","more","some","much","really","today",
  "yesterday","tomorrow","write","wrote","thing","things","moment","moments","life","note","notes",
]);

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

interface Entry {
  headline: string;
  body: string;
  mood: string;
  entry_type: string;
  created_at: string;
}

function generateNudges(entries: Entry[]): Array<{ text: string; type: string }> {
  const nudges: Array<{ text: string; type: string }> = [];

  if (entries.length === 0) {
    nudges.push({ text: "Your journal is empty. What brought you here today?", type: "welcome" });
    return nudges;
  }

  // ── Mood patterns ──
  const recentMoods = entries.slice(0, 7).map((e) => e.mood);
  const moodCounts = new Map<string, number>();
  for (const m of recentMoods) moodCounts.set(m, (moodCounts.get(m) ?? 0) + 1);
  const dominantMood = [...moodCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  if (dominantMood && dominantMood[1] >= 4) {
    const moodNudges: Record<string, string> = {
      sad: "You've been feeling heavy lately. What would lightness look like right now?",
      serious: "You've been in deep-thinking mode. What's the question underneath all of it?",
      funny: "You've been finding humor everywhere. What's making life feel lighter?",
      sorrowful: "There's been grief in your writing. What do you wish you could say to the person or thing you're missing?",
      "soul-piercing": "Something keeps cutting through. What truth are you circling around?",
      horror: "Something is unsettling you. If you could name the fear, what would it be?",
      suspense: "You're waiting for something. What would you do if you stopped waiting?",
    };
    const nudge = moodNudges[dominantMood[0]];
    if (nudge) nudges.push({ text: nudge, type: "mood-pattern" });
  }

  // ── Theme gaps (things they wrote about before but stopped) ──
  const olderEntries = entries.slice(7);
  const recentTokens = new Set(entries.slice(0, 7).flatMap((e) => tokenize(`${e.headline} ${e.body}`)));
  const oldTokenCounts = new Map<string, number>();
  for (const e of olderEntries) {
    for (const t of tokenize(`${e.headline} ${e.body}`)) {
      if (!recentTokens.has(t)) oldTokenCounts.set(t, (oldTokenCounts.get(t) ?? 0) + 1);
    }
  }
  const fadedThemes = [...oldTokenCounts.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  for (const [theme] of fadedThemes) {
    nudges.push({
      text: `You used to write about "${theme}" often but haven't recently. What happened there?`,
      type: "theme-gap",
    });
  }

  // ── Entry type suggestions ──
  const typeCounts = new Map<string, number>();
  for (const e of entries.slice(0, 14)) typeCounts.set(e.entry_type ?? "free-write", (typeCounts.get(e.entry_type ?? "free-write") ?? 0) + 1);

  if (!typeCounts.has("gratitude") && entries.length >= 5) {
    nudges.push({ text: "You haven't tried a gratitude entry yet. What's one thing today you didn't earn but still received?", type: "try-type" });
  }
  if (!typeCounts.has("letter") && entries.length >= 10) {
    nudges.push({ text: "Try writing a letter to your future self. What do you want to remember about this season?", type: "try-type" });
  }
  if (!typeCounts.has("dream") && entries.length >= 7) {
    nudges.push({ text: "Have you had any dreams worth capturing? They fade fast.", type: "try-type" });
  }

  // ── Writing frequency nudge ──
  if (entries.length >= 2) {
    const latest = new Date(entries[0].created_at);
    const previous = new Date(entries[1].created_at);
    const gapDays = Math.floor((latest.getTime() - previous.getTime()) / 86400000);
    if (gapDays >= 3) {
      nudges.push({
        text: `You had a ${gapDays}-day gap recently. Even a one-line check-in keeps the thread alive.`,
        type: "frequency",
      });
    }
  }

  // Return top 2 most relevant nudges
  return nudges.slice(0, 2);
}

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.journal.nudge");

  try {
    const accessToken = getAccessToken(request);

    if (!accessToken) {
      failRequest(trace, 401, "missing_session");
      const response = NextResponse.json({ error: "Missing session token." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const supabase = createSupabaseUserClient(accessToken);

    if (!supabase) {
      failRequest(trace, 503, "supabase_unconfigured");
      const response = NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
      return attachRequestId(response, trace.requestId);
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .select("headline, body, mood, entry_type, created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      failRequest(trace, 400, "nudge_query_failed");
      const response = NextResponse.json({ error: error.message }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const nudges = generateNudges(data ?? []);

    const response = NextResponse.json({ nudges });
    endRequest(trace, 200, { nudge_count: nudges.length });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "nudge_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
