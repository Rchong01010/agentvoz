# AgentVoz Stripe Integration Plan

**Product:** AgentVoz Pro -- $9.99/month recurring subscription
**Date:** 2026-03-30
**Status:** Research complete, ready to implement

---

## 1. Existing Stripe Credentials

**gabriella-amoura already has a Stripe account configured.**

The `.env.example` in `~/gabriella-amoura` shows three keys:
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

The Stripe SDK used there is `stripe@20.4.1` with API version `2026-02-25.clover`.

**AgentVoz currently has zero Stripe config.** The `.env` only has `GROQ_API_KEY` and `ELEVENLABS_*` keys.

**Action needed:** Use the same Stripe account (Reid's). Create a separate Product + Price in the Stripe Dashboard for AgentVoz. Add three new env vars to AgentVoz's `.env` and Vercel project settings:
- `STRIPE_SECRET_KEY` (same account, same key)
- `STRIPE_PUBLISHABLE_KEY` (no NEXT_PUBLIC_ prefix -- this is Vite, not Next.js; exposed via `VITE_` prefix if needed client-side)
- `STRIPE_WEBHOOK_SECRET` (unique per webhook endpoint -- must create a new one for agentvoz.com)

---

## 2. Stripe Resources to Create (Dashboard or API)

### Product
- **Name:** AgentVoz Pro
- **Description:** Unlimited AI Spanish conversation practice with Sofia

### Price
- **Amount:** $9.99 USD
- **Billing:** Monthly recurring
- **Lookup key:** `agentvoz_pro_monthly` (for easy reference in code)

### Webhook Endpoint
- **URL:** `https://agentvoz.com/api/webhook` (or `https://agentvoz.vercel.app/api/webhook`)
- **Events to listen for:**
  - `checkout.session.completed` -- subscription activated
  - `customer.subscription.updated` -- plan changes, payment method updates
  - `customer.subscription.deleted` -- cancellation
  - `invoice.payment_failed` -- failed renewal

### Customer Portal
- Enable Stripe Customer Portal in Dashboard settings
- Configure: allow cancel, allow pause (optional), show invoices
- No code needed to "create" this -- just enable it and use `stripe.billingPortal.sessions.create()` in an API route

---

## 3. Minimal Files Needed

### API Routes (Vercel serverless, in `api/` directory)

All routes follow the existing pattern in `api/chat.js` and `api/translate.js` (plain Node.js handler functions with `(req, res)` signature).

#### `api/create-checkout.js`
- POST endpoint
- Creates a Stripe Checkout Session in `subscription` mode
- Accepts: `{ email }` (optional, for pre-filling)
- Hardcodes the price ID (or uses lookup_key) -- no need for dynamic product selection (single plan)
- Sets `success_url` to `/learn?subscribed=true` and `cancel_url` to `/?canceled=true`
- Returns `{ url }` for redirect
- Rate limit: in-memory, 5 attempts per IP per hour

#### `api/webhook.js`
- POST endpoint
- Verifies Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`
- Handles events:
  - `checkout.session.completed`: log subscription start (console for MVP, Supabase later)
  - `customer.subscription.deleted`: log cancellation
  - `invoice.payment_failed`: log failure (future: send email)
- Must use raw body (not parsed JSON) for signature verification
- **Vercel note:** Need to disable body parsing. In the Vercel serverless convention, export a `config` object: `export const config = { api: { bodyParser: false } }`

#### `api/check-subscription.js`
- GET endpoint
- Accepts: `{ email }` or `{ customer_id }` as query param
- Calls `stripe.subscriptions.list({ customer, status: 'active' })` to verify active subscription
- Returns `{ active: true/false, plan: 'pro', current_period_end: timestamp }`
- This is the "paywall gate" -- frontend calls this to decide whether to unlock lessons

#### `api/create-portal.js`
- POST endpoint
- Accepts: `{ customer_id }` or `{ email }`
- Creates a Stripe Billing Portal session
- Returns `{ url }` for redirect to manage subscription

### Frontend Components

#### Pricing Section (modify `src/pages/Home.jsx`)
- Replace the existing "Free during beta. $9.99/mo coming soon." teaser (line 228-233) with a real pricing card
- Single plan card: "AgentVoz Pro -- $9.99/mo"
- Features list: unlimited conversations, all 4 dialects, 18 structured lessons, speed control
- CTA button: "Start Learning" that calls `/api/create-checkout`

#### Paywall Component (`src/components/Paywall.jsx`)
- Wraps the Learn page
- On mount, checks subscription status via `/api/check-subscription`
- If active: render children (the lesson)
- If not active: show upgrade prompt with pricing + CTA
- Store subscription status in sessionStorage to avoid re-checking every page load (TTL: 30 min)

#### Success Handler
- On `/learn?subscribed=true`, show a brief welcome toast/banner
- On `/?canceled=true`, show "Changed your mind?" prompt

---

## 4. NPM Packages Needed

**Server-side only (api/ routes):**
- `stripe` -- Stripe Node.js SDK (use same version as gabriella: `^20.4.1`)

**Client-side (optional, NOT required for MVP):**
- `@stripe/stripe-js` -- only needed if embedding Stripe Elements (embedded checkout form). NOT needed for Checkout Session redirect flow.

**For MVP, only `stripe` is needed.** The flow redirects to Stripe's hosted checkout page, so no client-side Stripe SDK is required.

Install command when ready:
```bash
npm install stripe
```

---

## 5. MVP Architecture (No Database)

The key insight: for a single-plan subscription with no user accounts, we can lean on Stripe as the source of truth.

### Flow

```
User clicks "Start Learning"
  --> POST /api/create-checkout (email required)
  --> Redirect to Stripe Checkout (hosted page)
  --> User pays
  --> Stripe redirects to /learn?subscribed=true&session_id={id}
  --> Frontend stores email in localStorage
  --> On future visits, GET /api/check-subscription?email={email}
  --> If active subscription exists, unlock content
```

### Authentication (MVP)
- **No passwords, no auth provider.** Email is the identifier.
- User enters email at checkout. Stripe stores it on the Customer object.
- Frontend stores the email in localStorage after successful checkout.
- `/api/check-subscription` looks up the Stripe customer by email and checks subscription status.
- **Weakness:** Anyone who knows a subscriber's email could access content. Acceptable for MVP; fix later with proper auth (Clerk, Supabase Auth, etc.).

### What's Free vs. Paid
- **Free:** Home page, dialect selection, 1 free conversation (first lesson or free conversation with 3-minute limit)
- **Paid:** Unlimited conversations, all 18 structured lessons, all immersion levels, speed control

---

## 6. Environment Variables to Add

### `.env` (local development)
```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Vercel Project Settings
Same three variables. Use production keys for production, test keys for preview deployments.

### `.env.example` (update for repo)
```
GROQ_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
STRIPE_SECRET_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## 7. Implementation Order

1. **Stripe Dashboard setup** (5 min)
   - Create "AgentVoz Pro" product + $9.99/mo price
   - Note the Price ID (price_xxx)
   - Enable Customer Portal

2. **Add env vars** (5 min)
   - Add to `.env` locally (test keys)
   - Add to Vercel project settings (test keys for preview, live keys for production)

3. **Install stripe package** (1 min)
   - `npm install stripe`

4. **Build API routes** (30 min)
   - `api/create-checkout.js`
   - `api/webhook.js`
   - `api/check-subscription.js`
   - `api/create-portal.js`

5. **Build frontend** (30 min)
   - Pricing card on Home page
   - Paywall component
   - Success/cancel handling
   - "Manage subscription" link (portal)

6. **Test with Stripe CLI** (15 min)
   - `stripe listen --forward-to localhost:5173/api/webhook`
   - Test full flow with test card 4242424242424242

7. **Deploy + wire production webhook** (10 min)
   - Push to main (auto-deploys)
   - Create webhook endpoint in Stripe Dashboard pointing to `https://agentvoz.com/api/webhook`
   - Add production webhook secret to Vercel env vars

---

## 8. Security Checklist

- [ ] STRIPE_SECRET_KEY only used server-side (api/ routes)
- [ ] Webhook signature verification on every webhook call
- [ ] Rate limiting on create-checkout endpoint
- [ ] CSRF: validate Origin header on POST endpoints
- [ ] Price ID hardcoded server-side (user cannot manipulate price)
- [ ] No secrets in client-side bundle (only VITE_ prefixed vars are exposed)
- [ ] Error messages do not leak Stripe internals

---

## 9. Future Enhancements (Post-MVP)

- **Proper auth:** Add Clerk or Supabase Auth for real user accounts
- **Usage tracking:** Store conversation count per user in Supabase
- **Free tier limits:** 3 conversations/week free, unlimited for Pro
- **Annual plan:** $99/year ($8.25/mo) as second Price on same Product
- **Trial period:** 7-day free trial on first subscription
- **Referral codes:** Stripe Promotion Codes for influencer/affiliate tracking
- **Multiple tiers:** Pro ($9.99) vs. Premium ($19.99 with D-ID avatar, priority voice)
