# Flowstock — Project Memory

## Project Overview
- **Name**: Flowstock (formerly Barflow) — Bar inventory/POS SaaS
- **Stack**: Next.js 16 (App Router) + Supabase + Stripe + Google Gemini AI + GCP Cloud Run
- **Repo**: https://github.com/ArkVault/barflow.git
- **Production URL**: https://flowstock-686958505968.us-central1.run.app
- **Branch strategy**: All work on `phase3/production-enablement`, push only to that branch

## Stripe Live Account
- Account: `acct_1NKrF5DaYn7MP37Q`
- Products:
  - Bar Sucursal (`prod_U8cJ1QghUBh7AK`): Monthly $899 MXN (`price_1TAL5ZDaYn7MP37QvhZbZVEH`), Yearly $8,400 MXN (`price_1TAL5ZDaYn7MP37QR9hoIfZF`)
  - Cadena Flowstock (`prod_U8cJlpyToSzC6l`): Monthly $2,999 MXN (`price_1TAL5aDaYn7MP37QnIViOKSQ`)
- Webhook endpoint: `https://flowstock-686958505968.us-central1.run.app/api/stripe/webhook`

## Deploy Command
```bash
cd /Users/gibrann/Desktop/Barflow && gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_NEXT_PUBLIC_SUPABASE_URL="...",_NEXT_PUBLIC_SUPABASE_ANON_KEY="...",_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="...",_STRIPE_SECRET_KEY="...",_STRIPE_WEBHOOK_SECRET="...",_GEMINI_API_KEY="...",_NEXT_PUBLIC_STRIPE_BAR_MONTHLY_PRICE_ID="...",_NEXT_PUBLIC_STRIPE_BAR_YEARLY_PRICE_ID="...",_NEXT_PUBLIC_STRIPE_CHAIN_PRICE_ID="...",_NEXT_PUBLIC_APP_URL="https://flowstock-686958505968.us-central1.run.app"
```
Note: Get actual values from `.env.local`. Do NOT include `_SUPABASE_SERVICE_ROLE_KEY` (not in cloudbuild.yaml template).

## Roadmap Status (as of 2026-03-14)

### ✅ Phase 1 — Critical Fixes (ALL DONE)
- [x] Auth check on `/api/parse-menu` (now at `/api/menu/parse`)
- [x] Remove `ignoreBuildErrors: true` + fix all 8 TS errors (commit `f5cb618`)
- [x] Fix `saveLayout()` race condition — `.catch()` in event handlers, `await` in async
- [x] Deduplicate Stripe webhooks — second file re-exports from primary
- [x] Move hardcoded dev emails to `NEXT_PUBLIC_DEV_EMAILS` env var

### ✅ Phase 2 — Security Hardening (ALL DONE)
- [x] Rate limiting on `/api/quotes` (5 req/10min), `/api/menu/parse` (10 req/5min), `/api/stripe/checkout` (5 req/10min)
- [x] Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS, CSP, Permissions-Policy
- [x] Error handling in `fetchEstablishment()` — try/catch with fallback
- [x] Null check in layout-manager — N/A in main codebase
- [x] Supabase realtime error listener on subscription channel

### ✅ Phase 3 — Production Enablement (ALL DONE)
- [x] Stripe live mode — `sk_live_` / `pk_live_` keys configured
- [x] `lib/stripe/config.ts` fixed (env var names, chain price, PlanType)
- [x] Image optimization — acceptable for Cloud Run standalone
- [x] Error boundaries — `app/error.tsx` + `app/dashboard/error.tsx`
- [x] Configurable tax rate — DB migration + auth-context + settings form + server action
- [x] Transactional emails — Resend installed, 5 templates wired to webhook + quotes

### ✅ Phase 4 — Feature Completion (PARTIALLY DONE)
- [x] `/dashboard/cuenta` — Fully implemented (1,174 lines)
- [x] `/dashboard/configuracion` — Form with real save via server action
- [x] Transactional emails — Resend module at `lib/email/resend.ts` (quote, welcome, trial-ending, subscription-confirmed, payment-failed)
- [ ] Onboarding flow — No onboarding components exist yet

### 🧹 Cleanup (PENDING)
- [ ] Delete old logo files from `public/`: `modoclaro.png`, `modoclaro.svg`, `modoscuro.png`, `modoscuro.svg`, `placeholder-logo.png`, `placeholder-logo.svg`, `placeholder-user.jpg`, `placeholder.jpg`, `placeholder.svg`
- [ ] Apply DB migration in Supabase SQL editor: `supabase/migrations/20260312_add_tax_rate_to_establishments.sql`
- [ ] Update Cloud Build trigger substitution variables in GCP Console (currently passed manually)

### 📋 Future Considerations
- Onboarding flow after sign-up
- Welcome email trigger (currently defined but not wired to sign-up)
- Cloud Build trigger with persistent substitution variables
- `.env.production` cleanup (still references old domain)

## Key Files
- `lib/stripe/config.ts` — Stripe config, PlanType, price IDs
- `lib/email/resend.ts` — All transactional email templates
- `lib/security/rate-limit.ts` — In-memory sliding window rate limiter
- `app/api/webhooks/stripe/route.ts` — Primary webhook handler (emails wired here)
- `hooks/use-subscription.ts` — Client-side subscription state + realtime
- `contexts/auth-context.tsx` — Auth + establishment + taxRate
- `components/configuracion/settings-form.tsx` — Tax rate / settings UI
- `app/dashboard/configuracion/actions.ts` — Server action for settings save
- `next.config.mjs` — Security headers, standalone output (no ignoreBuildErrors)

## Important Notes
- `NEXT_PUBLIC_*` vars are baked at build time — runtime-only updates don't affect client code
- Worktree at `.claude/worktrees/vigorous-lalande` is stale — code lives at `/Users/gibrann/Desktop/Barflow`
- `@stripe/stripe-js` v8 removed `redirectToCheckout` — use `window.location.href = url` instead
- Node 22 requires `new Uint8Array(buffer)` for crypto operations (Buffer type mismatch)
