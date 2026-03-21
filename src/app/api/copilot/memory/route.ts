import { NextRequest, NextResponse } from "next/server";

import { getAccessToken } from "@/lib/auth/token";
import { createSupabaseUserClient } from "@/lib/supabase/server";
import { attachRequestId, beginRequest, endRequest, failRequest } from "@/lib/telemetry";

const STOP_WORDS = new Set([
  "the","and","that","have","with","this","from","your","about","there","their","would","could","should",
  "into","because","while","where","when","what","which","were","been","after","before","still","very",
  "just","than","then","them","they","felt","feel","even","only","more","some","much","really","today",
  "yesterday","tomorrow","write","wrote","thing","things","moment","moments","life","note","notes"
]);

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));
}

function buildTimelinePoints(entries: Array<{ mood: string; created_at: string }>, days: number) {
  const buckets = new Map<string, { date: string; count: number; topMood: string | null }>();
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;

  for (const entry of entries) {
    const createdAt = new Date(entry.created_at);
    if (createdAt.getTime() < threshold) continue;

    const date = createdAt.toISOString().slice(0, 10);
    const current = buckets.get(date) ?? { date, count: 0, topMood: null };
    current.count += 1;
    current.topMood = entry.mood;
    buckets.set(date, current);
  }

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
}

function buildMoodTrend(entries: Array<{ mood: string; created_at: string }>) {
  const recent = entries.slice(0, 20);
  const counts = new Map<string, number>();
  for (const entry of recent) {
    counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([mood, count]) => ({ mood, count }));
}

function buildWindowSummary(
  entries: Array<{ headline: string; body: string; mood: string; created_at: string }>,
  days: number,
) {
  const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
  const windowEntries = entries.filter((entry) => new Date(entry.created_at).getTime() >= threshold);
  const moodCounts = new Map<string, number>();
  const tokenCounts = new Map<string, number>();

  for (const entry of windowEntries) {
    moodCounts.set(entry.mood, (moodCounts.get(entry.mood) ?? 0) + 1);
    for (const token of tokenize(`${entry.headline} ${entry.body}`)) {
      tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
    }
  }

  const topMood = [...moodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topThemes = [...tokenCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);

  let summary = "Not enough writing yet in this window to form a recap.";

  if (windowEntries.length > 0) {
    summary = [
      `You captured ${windowEntries.length} journal ${windowEntries.length === 1 ? "entry" : "entries"} in the last ${days} days.`,
      topMood ? `The strongest recurring mood was ${topMood}.` : null,
      topThemes.length > 0 ? `The themes that kept resurfacing were ${topThemes.join(", ")}.` : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return {
    days,
    entryCount: windowEntries.length,
    topMood,
    topThemes,
    summary,
  };
}

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.copilot.memory");

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      failRequest(trace, 401, "invalid_session");
      const response = NextResponse.json({ error: "Invalid session." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const [{ data: entries, error: entriesError }, { data: compositions, error: compositionsError }] = await Promise.all([
      supabase
        .from("journal_entries")
        .select("id, headline, body, mood, created_at")
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("compositions")
        .select("id, title, excerpt, mode, mood, reflection, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (entriesError || compositionsError) {
      failRequest(trace, 400, "memory_query_failed", {
        entries_error: entriesError?.message,
        compositions_error: compositionsError?.message,
      });
      const response = NextResponse.json({ error: entriesError?.message ?? compositionsError?.message ?? "Could not build memory view." }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const moodCounts = new Map<string, number>();
    const tokenCounts = new Map<string, number>();

    for (const entry of entries ?? []) {
      moodCounts.set(entry.mood, (moodCounts.get(entry.mood) ?? 0) + 1);
      for (const token of tokenize(`${entry.headline} ${entry.body}`)) {
        tokenCounts.set(token, (tokenCounts.get(token) ?? 0) + 1);
      }
    }

    const recurringMoods = [...moodCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mood, count]) => ({ mood, count }));

    const recurringThemes = [...tokenCounts.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([theme, count]) => ({ theme, count }));

    const reflectionMoments = (compositions ?? [])
      .filter((item) => item.reflection && typeof item.reflection === "object")
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        excerpt: item.excerpt,
        mode: item.mode,
        mood: item.mood,
        created_at: item.created_at,
        reflection: item.reflection,
      }));

    const weeklyRecap = buildWindowSummary(entries ?? [], 7);
    const monthlyRecap = buildWindowSummary(entries ?? [], 30);
    const timelinePoints = buildTimelinePoints(entries ?? [], 30);
    const moodTrend = buildMoodTrend(entries ?? []);

    const response = NextResponse.json({
      recurringMoods,
      recurringThemes,
      reflectionMoments,
      weeklyRecap,
      monthlyRecap,
      timelinePoints,
      moodTrend,
      recentEntryCount: entries?.length ?? 0,
    });

    endRequest(trace, 200, {
      user_id: user.id,
      entries_count: entries?.length ?? 0,
      compositions_count: compositions?.length ?? 0,
    });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "memory_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
