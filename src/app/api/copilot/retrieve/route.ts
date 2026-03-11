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
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

function makeSnippet(input: string, token: string) {
  const lower = input.toLowerCase();
  const index = lower.indexOf(token.toLowerCase());
  if (index < 0) {
    return input.slice(0, 180);
  }

  const start = Math.max(0, index - 70);
  const end = Math.min(input.length, index + 110);
  return `${start > 0 ? "…" : ""}${input.slice(start, end)}${end < input.length ? "…" : ""}`;
}

function scoreText(input: string, tokens: string[]) {
  const lower = input.toLowerCase();
  return tokens.reduce((score, token) => score + (lower.includes(token) ? 1 : 0), 0);
}

export async function GET(request: NextRequest) {
  const trace = beginRequest(request, "api.copilot.retrieve");

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
    } = await supabase.auth.getUser();

    if (userError || !user) {
      failRequest(trace, 401, "invalid_session");
      const response = NextResponse.json({ error: "Invalid session." }, { status: 401 });
      return attachRequestId(response, trace.requestId);
    }

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const tokens = tokenize(query).slice(0, 8);

    if (tokens.length === 0) {
      const response = NextResponse.json({ query, entries: [], compositions: [] });
      endRequest(trace, 200, { user_id: user.id, query_length: query.length, result_count: 0 });
      return attachRequestId(response, trace.requestId);
    }

    const [{ data: entries, error: entriesError }, { data: compositions, error: compositionsError }] = await Promise.all([
      supabase
        .from("journal_entries")
        .select("id, headline, body, mood, created_at")
        .order("created_at", { ascending: false })
        .limit(80),
      supabase
        .from("compositions")
        .select("id, title, excerpt, draft, mode, mood, reflection, created_at")
        .order("created_at", { ascending: false })
        .limit(60),
    ]);

    if (entriesError || compositionsError) {
      failRequest(trace, 400, "retrieve_query_failed", {
        entries_error: entriesError?.message,
        compositions_error: compositionsError?.message,
      });
      const response = NextResponse.json({ error: entriesError?.message ?? compositionsError?.message ?? "Could not retrieve memories." }, { status: 400 });
      return attachRequestId(response, trace.requestId);
    }

    const matchedEntries = (entries ?? [])
      .map((entry) => {
        const haystack = `${entry.headline}\n${entry.body}`;
        const score = scoreText(haystack, tokens);
        return score > 0
          ? {
              id: entry.id,
              kind: "entry" as const,
              title: entry.headline,
              mood: entry.mood,
              created_at: entry.created_at,
              score,
              snippet: makeSnippet(entry.body, tokens[0]),
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const matchedCompositions = (compositions ?? [])
      .map((item) => {
        const reflectionText = item.reflection && typeof item.reflection === "object" ? JSON.stringify(item.reflection) : "";
        const haystack = `${item.title}\n${item.excerpt}\n${item.draft}\n${reflectionText}`;
        const score = scoreText(haystack, tokens);
        return score > 0
          ? {
              id: item.id,
              kind: "composition" as const,
              title: item.title,
              mood: item.mood,
              mode: item.mode,
              created_at: item.created_at,
              score,
              snippet: makeSnippet(`${item.excerpt} ${item.draft}`, tokens[0]),
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const response = NextResponse.json({
      query,
      entries: matchedEntries,
      compositions: matchedCompositions,
    });

    endRequest(trace, 200, {
      user_id: user.id,
      query_length: query.length,
      result_count: matchedEntries.length + matchedCompositions.length,
    });
    return attachRequestId(response, trace.requestId);
  } catch (error) {
    failRequest(trace, 500, "retrieve_unhandled_error", {
      error: error instanceof Error ? error.message : "unknown",
    });
    const response = NextResponse.json({ error: "Internal server error." }, { status: 500 });
    return attachRequestId(response, trace.requestId);
  }
}
