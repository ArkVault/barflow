# API Ownership Map

Purpose: define canonical API route ownership so future refactors can remove duplicates without behavior changes.

## Canonical Routes (source of truth)

- `POST /api/supplies` - supply batch save/create/update flow.
- `GET /api/supplies/schema` - supply categories and known supplies schema.
- `POST /api/menu/parse` - AI-assisted menu/supply parsing.
- `POST /api/quotes` - public quote intake endpoint.
- `POST /api/stripe/checkout` - Stripe checkout session creation.
- `POST /api/webhooks/stripe` - Stripe webhook processing.
- `POST /api/webhooks/opentable/[establishmentId]` - OpenTable webhook processing.

## Compatibility Aliases (temporary)

- `POST /api/save-supplies` -> alias to `/api/supplies`
- `GET /api/supply-schema` -> alias to `/api/supplies/schema`
- `POST /api/parse-menu` -> alias to `/api/menu/parse`
- `POST /api/send-quote` -> alias to `/api/quotes`
- `POST /api/create-checkout-session` -> alias to `/api/stripe/checkout`
- `POST /api/stripe/create-checkout-session` -> alias to `/api/stripe/checkout`
- `POST /api/stripe/webhook` -> alias to `/api/webhooks/stripe` (already consolidated)

## Migration Rule

- New code must call canonical routes only.
- Alias routes must not contain business logic; they should re-export canonical handlers.
- Remove aliases only after all known callers are migrated and smoke-tested.
