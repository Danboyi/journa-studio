import type { SupabaseClient } from "@supabase/supabase-js";

function getUtcDayStartIso() {
  const now = new Date();
  const dayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  return dayStart.toISOString();
}

export async function reserveDailyUsage(
  supabase: SupabaseClient,
  options: {
    userId: string;
    endpoint: string;
    units: number;
    dailyLimit: number;
  },
) {
  const startOfDay = getUtcDayStartIso();

  const { data, error } = await supabase
    .from("usage_events")
    .select("units")
    .eq("user_id", options.userId)
    .eq("endpoint", options.endpoint)
    .gte("created_at", startOfDay)
    .limit(2000);

  if (error) {
    return { allowed: false as const, reason: "Could not verify usage quota." };
  }

  const consumed = (data ?? []).reduce((sum, item) => sum + (item.units ?? 0), 0);

  if (consumed + options.units > options.dailyLimit) {
    return {
      allowed: false as const,
      reason: "Daily AI budget exceeded. Try again tomorrow or reduce input size.",
    };
  }

  const { error: insertError } = await supabase.from("usage_events").insert({
    user_id: options.userId,
    endpoint: options.endpoint,
    units: options.units,
  });

  if (insertError) {
    return { allowed: false as const, reason: "Could not reserve usage budget." };
  }

  return { allowed: true as const };
}
