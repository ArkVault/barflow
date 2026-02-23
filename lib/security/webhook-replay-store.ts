import { createClient } from "@supabase/supabase-js";
import { markAndCheckReplay } from "@/lib/security/webhook-guards";
import { auditLog } from "@/lib/security/audit-log";

type ReplayCheckOptions = {
  source: "stripe" | "opentable";
  replayKey: string;
  ttlSeconds: number;
  metadata?: Record<string, unknown>;
};

function shouldRequirePersistentStore() {
  const explicit = process.env.WEBHOOK_REPLAY_REQUIRE_PERSISTENT;
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  return process.env.NODE_ENV === "production";
}

export async function checkAndStoreReplayKey({
  source,
  replayKey,
  ttlSeconds,
  metadata = {},
}: ReplayCheckOptions) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const requirePersistent = shouldRequirePersistentStore();

  // Fallback for environments without service-role credentials.
  if (!url || !serviceRoleKey) {
    if (requirePersistent) {
      auditLog("error", "webhook_replay_store_unavailable", { source });
      return { duplicate: false, persisted: false, unavailable: true };
    }
    const duplicate = markAndCheckReplay(`${source}:${replayKey}`, ttlSeconds);
    if (!url || !serviceRoleKey) {
      auditLog("warn", "webhook_replay_store_in_memory_fallback", { source });
    }
    return { duplicate, persisted: false, unavailable: false };
  }

  const supabase = createClient(url, serviceRoleKey);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

  const { error } = await supabase
    .from("webhook_replay_keys")
    .insert({
      replay_key: replayKey,
      source,
      expires_at: expiresAt,
      metadata,
    });

  if (!error) {
    return { duplicate: false, persisted: true, unavailable: false };
  }

  // Duplicate key => replay detected.
  if ((error as { code?: string }).code === "23505") {
    return { duplicate: true, persisted: true, unavailable: false };
  }

  // Missing table or permission issue: in production fail closed, in dev fallback.
  if (requirePersistent) {
    auditLog("error", "webhook_replay_store_db_unavailable", {
      source,
      code: (error as { code?: string }).code || "unknown",
    });
    return { duplicate: false, persisted: false, unavailable: true };
  }

  // Non-production fallback.
  const duplicate = markAndCheckReplay(`${source}:${replayKey}`, ttlSeconds);
  auditLog("warn", "webhook_replay_store_db_fallback", {
    source,
    code: (error as { code?: string }).code || "unknown",
  });
  return { duplicate, persisted: false, unavailable: false };
}
