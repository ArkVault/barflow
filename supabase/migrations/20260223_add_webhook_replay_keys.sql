-- Replay-protection store for webhook idempotency
-- Added: February 2026

CREATE TABLE IF NOT EXISTS public.webhook_replay_keys (
    replay_key text PRIMARY KEY,
    source text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_webhook_replay_keys_expires_at
    ON public.webhook_replay_keys (expires_at);

COMMENT ON TABLE public.webhook_replay_keys IS
    'Stores webhook replay keys to enforce idempotency across instances.';

COMMENT ON COLUMN public.webhook_replay_keys.replay_key IS
    'Deterministic unique key per webhook delivery/event.';

COMMENT ON COLUMN public.webhook_replay_keys.expires_at IS
    'Replay window expiration. Expired keys can be periodically deleted.';
