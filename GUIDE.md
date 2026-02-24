# EMR Adopt — Self-Build Guide

A step-by-step guide to build the full donation platform yourself.
**Stack**: Next.js 14 · TypeScript · Prisma · NextAuth · Stripe · Resend · Tailwind · shadcn/ui

---

## How to use this guide

- Work through one chunk per session (~4 hours each)
- Each chunk has a **Goal** (what you'll be able to do at the end), **Concepts** (things to understand first), **Tasks** (what to build), and a **Checkpoint** (how to know you're done)
- You don't need to write the code alone — use Claude to help you write each piece. The goal is that **you understand what you're building** before moving on
- Reference build available at: `C:\Users\Bio\donation-platform\`

---

## Architecture Overview

Before you start, understand the big picture:

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                            │
│  Public pages   Donor pages   Recipient pages   Admin   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────┐
│                   NEXT.JS SERVER                        │
│  App Router pages (Server Components + Client Components)│
│  API Routes (REST endpoints)                            │
└──────┬─────────────────────────┬───────────────────────┘
       │                         │
┌──────▼──────┐         ┌────────▼────────┐
│   PRISMA    │         │  STRIPE / RESEND│
│  SQLite DB  │         │  External APIs  │
└─────────────┘         └─────────────────┘
```

**Three user roles:**
- `DONOR` — international donors, browse and adopt RHUs
- `RECIPIENT` — Philippine RHU staff, create listings, receive funds
- `ADMIN` — validate listings, manage the platform

**Key flows:**
1. Recipient registers → creates listing → Admin validates → listing goes public
2. Donor registers → browses → adopts → Stripe charges them → money goes to recipient
3. Donor ↔ Recipient communicate via message threads per adoption

---

## Chunk 1 — Project Setup & Database (4 hrs)

### Goal
Running dev server at `localhost:3000`. Database created and seeded with sample data.

### Concepts to understand first (30 min reading)
- **Next.js App Router**: files in `src/app/` become routes. `page.tsx` is the page. `layout.tsx` wraps all pages in a folder. `route.ts` is an API endpoint.
- **Prisma**: a type-safe way to talk to a database from TypeScript. You define your data models in `schema.prisma`, run a migration, and Prisma generates TypeScript types automatically.
- **SQLite**: a simple file-based database — perfect for development. We'll switch to PostgreSQL later for production.

### Tasks

**1. Scaffold the project**
```bash
cd C:\Users\Bio\Desktop\Code
npx create-next-app@14 emr-adopt --typescript --tailwind --app --src-dir --import-alias "@/*" --no-eslint --no-git
cd emr-adopt
```

**2. Install all dependencies**
```bash
npm install prisma @prisma/client next-auth bcryptjs stripe resend clsx tailwind-merge @types/bcryptjs ts-node dotenv
```

What each package does:
| Package | Purpose |
|---|---|
| `prisma` + `@prisma/client` | Database ORM — define models, run queries |
| `next-auth` | Authentication — handles login sessions |
| `bcryptjs` | Password hashing (never store plain text passwords) |
| `stripe` | Stripe API — create payment sessions, handle webhooks |
| `resend` | Send transactional emails |
| `clsx` + `tailwind-merge` | Utility for combining CSS class names |
| `ts-node` | Run TypeScript files directly (used for seed script) |
| `dotenv` | Load `.env` files in scripts |

**3. Initialize shadcn/ui**
```bash
npx shadcn@latest init --yes --defaults
npx shadcn@latest add button card input label badge table select textarea avatar dropdown-menu sheet separator toast --yes
```

shadcn gives you pre-built, accessible UI components. They're just copied into your project as source files you can edit.

**4. Initialize Prisma**
```bash
npx prisma init --datasource-provider sqlite
```

**5. Write the database schema**

Open `prisma/schema.prisma` and replace everything after the datasource block with the models below. Ask Claude to explain any part you don't understand.

Models to create (in order — later ones reference earlier ones):
1. `User` — `id`, `email`, `password`, `name`, `role` (string, default "DONOR"), `createdAt`, `updatedAt`
   - has optional relation to `DonorProfile`, `RecipientProfile`
   - has many `Notification[]`, `Message[]` (relation "SentMessages")
2. `DonorProfile` — `id`, `userId` (unique), `country`, `organization?`, `stripeCustomerId?`
   - belongs to `User`, has many `Adoption[]`
3. `RecipientProfile` — `id`, `userId` (unique), `organization`, `position`, `phone`, `stripeAccountId?`, `stripeOnboarded` (default false)
   - belongs to `User`, has many `RHUListing[]`
4. `RHUListing` — `id`, `recipientId`, `rhuName`, `description`, `location`, `province`, `region`, `imageUrl?`, `status` (default "DRAFT"), `validationNotes?`, `validatedAt?`, `validatedBy?`, `receiptInstructions?`, `createdAt`, `updatedAt`
   - belongs to `RecipientProfile`, has many `Adoption[]`, `ListingValidation[]`
5. `ListingValidation` — `id`, `listingId`, `adminId`, `action`, `notes?`, `createdAt`
   - belongs to `RHUListing`
6. `Adoption` — `id`, `donorId`, `listingId`, `isRecurring` (default false), `status` (default "ACTIVE"), `stripeSubscriptionId?`, `startedAt`, `cancelledAt?`, `nextPaymentAt?`
   - belongs to `DonorProfile`, `RHUListing`, has many `Donation[]`, `Message[]`
7. `Donation` — `id`, `adoptionId`, `amountCents` (Int), `currency` (default "usd"), `status` (default "PENDING"), `stripeSessionId?` (unique), `stripePaymentIntentId?`, `createdAt`, `updatedAt`
   - belongs to `Adoption`
8. `Message` — `id`, `adoptionId`, `senderId`, `content`, `isRead` (default false), `createdAt`
   - belongs to `Adoption`, belongs to `User` (relation "SentMessages")
9. `Notification` — `id`, `userId`, `type`, `title`, `body`, `isRead` (default false), `link?`, `createdAt`
   - belongs to `User`
10. `Setting` — `key` (id), `value`, `updatedAt`

> Tip: Look at `C:\Users\Bio\donation-platform\prisma\schema.prisma` as a complete reference.

**6. Run migration**
```bash
npx prisma migrate dev --name init
```

**7. Write the seed script** `prisma/seed.ts`

The seed creates:
- Admin user: `admin@emradopt.org` / `admin123!`
- Recipient user: `recipient@example.com` / `recipient123!`
- Donor user: `donor@example.com` / `donor123!`
- Platform setting: `{ key: "donation_amount_cents", value: "50000" }` (= $500)
- 2 validated + 1 pending sample RHU listings

Add to `package.json` (inside the outer `{}`):
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Run the seed:
```bash
npx prisma db seed
```

**8. Create environment files**

Create `.env.local` (never commit this):
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="dev-secret-change-me"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_REPLACE"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_REPLACE"
STRIPE_WEBHOOK_SECRET="whsec_REPLACE"
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_REPLACE"
RESEND_API_KEY="re_REPLACE"
EMAIL_FROM="noreply@yourdomain.com"
```

Create `.env.example` (commit this — no real secrets):
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_..."
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

**9. Create `.gitignore`** — make sure it includes `.env*.local`, `prisma/dev.db`, `node_modules/`, `/.next/`

**10. Test it**
```bash
npm run dev
```
Open `http://localhost:3000` — you should see the default Next.js welcome page.

Open Prisma Studio to browse your database:
```bash
npx prisma studio
```

### Checkpoint ✓
- `localhost:3000` shows the Next.js default page
- Prisma Studio shows all 10 tables with seed data
- No TypeScript errors (`npx tsc --noEmit`)

---

## Chunk 2 — Core Library Files & Layout Shell (4 hrs)

### Goal
A functioning page skeleton: Navbar, Footer, landing page. The site looks like a real app, even though only static content exists so far.

### Concepts to understand first (20 min)
- **Server Components vs Client Components**: In Next.js App Router, components default to Server Components (run on the server, can query the DB directly). Add `"use client"` at the top to make them run in the browser. Use server components for data fetching, client components for interactivity (click handlers, state, etc.)
- **`cn()` utility**: combines Tailwind classes safely — `cn("px-4", condition && "bg-red-500")`

### Tasks

**1. Create `src/lib/prisma.ts`** — Prisma client singleton
```typescript
// Pattern that prevents creating too many connections in dev mode (hot reload)
import { PrismaClient } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

**2. Create `src/lib/utils.ts`** — after running shadcn init, add these two functions to the existing file:
```typescript
export function formatCurrency(amountCents: number, currency = "usd"): string { ... }
export function formatDate(date: Date | string): string { ... }
```
Use `Intl.NumberFormat` and `Intl.DateTimeFormat`. Ask Claude to fill in the body.

**3. Create `src/lib/email.ts`** — Resend client + HTML email template functions
- `sendEmail(to, subject, html)` — wraps Resend, catches errors silently
- `welcomeEmail(name, role)` — returns HTML string
- `adoptionCreatedEmailDonor(...)` — returns HTML string
- `listingValidatedEmail(...)` — returns HTML string
- `messageReceivedEmail(...)` — returns HTML string
- `adoptionCancelledEmail(...)` — returns HTML string
- `subscriptionRenewedEmail(...)` — returns HTML string

**4. Create `src/lib/notifications.ts`** — helper function
```typescript
export async function createNotification(userId, type, title, body, link?) {
  return prisma.notification.create({ data: { userId, type, title, body, link } })
}
```

**5. Create `src/lib/stripe.ts`** — Stripe client singleton
```typescript
import Stripe from "stripe"
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
})
```

**6. Create `src/types/next-auth.d.ts`** — extend the session type to include `id` and `role`
```typescript
// This tells TypeScript that our session.user has extra fields
import "next-auth"
declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name: string; role: string }
  }
  interface User { role: string }
}
declare module "next-auth/jwt" {
  interface JWT { id: string; role: string }
}
```

**7. Create `src/components/providers/SessionProvider.tsx`**
```typescript
"use client"
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
export function SessionProvider({ children }) { ... }
```

**8. Build `src/components/layout/Footer.tsx`** — Simple footer with logo + tagline + links. Server component, no interactivity needed.

**9. Build `src/components/layout/Navbar.tsx`** — Split into two files:
- `Navbar.tsx` — server component, reads session with `getServerSession(authOptions)`, passes `user` as a prop to...
- `NavbarClient.tsx` — `"use client"` component with mobile menu toggle state, `signOut` button

The Navbar should show different links based on `user.role`:
- Not logged in: Browse RHUs | Sign In | Register
- DONOR: Browse RHUs | Dashboard | My Adoptions | (notification bell) | Sign Out
- RECIPIENT: Browse RHUs | Dashboard | My Listings | (notification bell) | Sign Out
- ADMIN: Listings | Admin | Sign Out

**10. Update `src/app/layout.tsx`** — replace the default layout with one that:
- Uses `Inter` font from `next/font/google`
- Wraps everything in `<SessionProvider>`
- Renders `<Navbar />` above main content
- Renders `<Footer />` below main content
- Includes `<Toaster />` from shadcn

**11. Build `src/app/page.tsx`** — Landing page (server component) with:
- Hero section: big headline, donation amount from DB settings, two CTAs (Browse / Register RHU)
- Stats bar: count of validated listings, active adoptions, total donated (query from DB)
- "How it works" — 3 cards
- CTA section for recipients

### Checkpoint ✓
- `localhost:3000` shows the landing page with real stats (from seed data)
- Navbar renders correctly
- `npx tsc --noEmit` passes

---

## Chunk 3 — Authentication (4 hrs)

### Goal
Users can register as Donor or Recipient, log in, and log out. The Navbar updates to show the correct links for their role.

### Concepts to understand first (30 min)
- **NextAuth.js + JWT**: NextAuth handles the auth flow. We use the "credentials" provider (email + password). After login, NextAuth creates a signed JWT (JSON Web Token) stored in a cookie. Every protected page can call `getServerSession()` to check who's logged in.
- **bcrypt**: Passwords must never be stored in plain text. `bcrypt.hash(password, 10)` hashes a password. `bcrypt.compare(plain, hashed)` verifies it.
- **Middleware flow**: User submits email+password → `authorize()` function runs bcrypt compare → if valid, returns user object → NextAuth encodes it in JWT → JWT stored in browser cookie → future requests include the cookie → `getServerSession()` decodes it

### Tasks

**1. Create `src/lib/auth.ts`** — NextAuth configuration object

Key parts:
- `session: { strategy: "jwt" }` — use JWT (no DB session table)
- `providers: [CredentialsProvider({ ... authorize(credentials) { ... } })]` — check email + bcrypt.compare password
- `callbacks.jwt({ token, user })` — when user first logs in, copy `user.id` and `user.role` into the JWT token
- `callbacks.session({ session, token })` — on every request, copy `token.id` and `token.role` into the session object
- `pages: { signIn: "/login" }` — redirect to our custom login page

**2. Create `src/app/api/auth/[...nextauth]/route.ts`**
```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

**3. Create `src/app/api/register/route.ts`** — POST handler that:
1. Reads `name`, `email`, `password`, `role` (and role-specific fields) from request body
2. Validates that email isn't already taken
3. Hashes the password with `bcrypt.hash(password, 10)`
4. Creates `User` + either `DonorProfile` or `RecipientProfile` in one Prisma create call (using nested `create`)
5. Sends welcome notification + email (wrap in `Promise.all(...).catch(console.error)` so it doesn't block the response)
6. Returns `{ success: true }` with status 201

**4. Create `src/app/(auth)/login/page.tsx`** — `"use client"` form with:
- Email and password inputs
- On submit: call `signIn("credentials", { email, password, redirect: false })`
- If `result.error` exists: show error message
- If success: `router.push("/")` and `router.refresh()`

**5. Create `src/app/(auth)/register/page.tsx`** — `"use client"` form with:
- **Role selector**: two buttons (Donor / RHU Representative), clicking one updates a `role` state
- Fields for all users: Name, Email, Password
- Additional fields if **DONOR**: Country, Organization (optional)
- Additional fields if **RECIPIENT**: Organization name, Your position, Phone number
- On submit: `fetch("/api/register", { method: "POST", body: JSON.stringify({...form, role}) })`
- On success: auto sign-in with `signIn(...)`, then redirect to appropriate dashboard

### Understanding the `(auth)` folder name
The `(auth)` parentheses create a "route group" — it groups `/login` and `/register` together but doesn't add `(auth)` to the URL. The routes are still `/login` and `/register`.

### Checkpoint ✓
- Register a new donor account → redirected to `/donor/dashboard` (404 is fine for now)
- Register a new recipient → redirected to `/recipient/dashboard` (404 is fine)
- Sign out → redirected to `/`
- Log back in → Navbar shows correct role-specific links

---

## Chunk 4 — Public RHU Listings (4 hrs)

### Goal
Anyone can browse validated RHU listings and view individual RHU profiles, without needing an account.

### Concepts to understand first (20 min)
- **Server Components for data fetching**: Server Components can call Prisma directly (they run on the server). No API route needed for read-only public pages.
- **`searchParams` for filtering**: `page.tsx` receives `{ searchParams }` as a prop containing URL query params like `?search=laguna`

### Tasks

**1. Create `src/components/rhu/ValidationBadge.tsx`** — a small colored badge showing listing status

Status → display:
- `VALIDATED` → green badge with shield icon, text "Validated"
- `PENDING_VALIDATION` → yellow badge with clock icon, text "Pending Validation"
- `REJECTED` → red badge, text "Rejected"
- `DRAFT` → gray badge, text "Draft"
- `INACTIVE` → gray badge, text "Inactive"

Use a config object keyed by status so you don't repeat yourself.

**2. Create `src/components/rhu/RHUCard.tsx`** — a card component displaying:
- Image placeholder (gradient background with 🏥 emoji if no image)
- Status badge (top right)
- RHU name (bold)
- Location with MapPin icon
- Description (truncated to 3 lines with `line-clamp-3`)
- Footer: active donor count | View button | Adopt button (only if VALIDATED)

**3. Create `src/app/rhu/page.tsx`** — server component that:
- Accepts `searchParams: { search?: string }` as a prop
- Queries Prisma: `rHUListing.findMany({ where: { status: "VALIDATED", ... } })`
- If `search` is provided, use `{ OR: [{ rhuName: { contains: search } }, { location: ... }, { province: ... }] }`
- Include `_count: { select: { adoptions: { where: { status: "ACTIVE" } } } }` to show donor count
- Renders a search form (regular HTML `<form method="GET">`) and a grid of `<RHUCard />`

**4. Create `src/app/rhu/[id]/page.tsx`** — server component that:
- Queries the single listing by `params.id`
- If not found: calls `notFound()` (Next.js built-in)
- Shows full description, location, validation badge, donor count
- Sidebar: donation amount from Setting, Adopt button (or "Register to Adopt" for non-donors)
- Receipt instructions section (if present)

### Checkpoint ✓
- `/rhu` shows the 2 validated sample listings as cards
- Searching by "Laguna" filters to the correct listing
- Clicking a listing card opens the detail page
- The Adopt button is visible but clicking it goes to 404 (donor area not built yet)

---

## Chunk 5 — Recipient Listing Management (4 hrs)

### Goal
A recipient can log in, create an RHU listing, edit it, and submit it for admin validation.

### Concepts to understand first (20 min)
- **Role guards in layouts**: `src/app/recipient/layout.tsx` calls `getServerSession()` and redirects to `/login` if the user is not a RECIPIENT. Every page inside `/recipient/` gets this protection for free.
- **Optimistic UI with `router.refresh()`**: After a form submit changes data in the DB, call `router.refresh()` to re-fetch and re-render the server component data on the page without a full page reload.

### Tasks

**1. Create `src/app/recipient/layout.tsx`** — role guard
```typescript
const session = await getServerSession(authOptions)
if (!session || session.user.role !== "RECIPIENT") redirect("/login")
return <>{children}</>
```

**2. Create listings API routes**:

- `GET /api/listings` — public: returns `rHUListing.findMany({ where: { status: "VALIDATED" } })`
- `POST /api/listings` — auth: RECIPIENT only, creates a new listing with status `DRAFT`
- `PATCH /api/listings/[id]` — auth: only the listing's owner can update it, only if status is `DRAFT` or `REJECTED`
- `POST /api/listings/[id]/submit` — auth: changes status from `DRAFT`/`REJECTED` to `PENDING_VALIDATION`

For all authenticated routes: check `session.user.role === "RECIPIENT"`, then verify the listing belongs to that recipient before allowing changes.

**3. Create `src/app/recipient/dashboard/page.tsx`** — server component with:
- Warning banner if Stripe is not onboarded yet
- Stat cards: total listings, active donors, total received
- List of the recipient's listings with status badges and "Manage" links
- "New Listing" button

**4. Create `src/app/recipient/listings/page.tsx`** — list of listings with status + "Manage" button each

**5. Create `src/app/recipient/listings/new/page.tsx`** — `"use client"` form:
- Fields: RHU Name, Description (textarea), Location, Province, Region (dropdown of PH regions), Receipt Instructions (textarea)
- On submit: `fetch("/api/listings", { method: "POST", body: JSON.stringify(form) })`
- On success: redirect to the new listing's detail page `/recipient/listings/[id]`

**6. Create `src/app/recipient/listings/[id]/page.tsx`** — server component showing:
- Listing details + status badge
- Admin notes (if any) in a yellow warning box
- Stat cards: active donors, total received, all-time adoptions
- "Submit for Validation" button (client component) — calls `POST /api/listings/[id]/submit` then `router.refresh()`
- "Edit" link (only visible if DRAFT or REJECTED)
- List of adoptions (donors) — each showing donor name and status

### Checkpoint ✓
- Log in as recipient → dashboard shows 2 validated + 1 pending listing from seed
- Create a new listing → it appears with DRAFT status
- Click "Submit for Validation" → status changes to PENDING_VALIDATION
- Log in as admin (`admin@emradopt.org`) → `/admin` shows 404 (not built yet), but no auth errors

---

## Chunk 6 — Admin Validation (4 hrs)

### Goal
An admin can view all listings, approve or reject them with notes, and see a full history of validation actions.

### Tasks

**1. Create `src/app/admin/layout.tsx`** — role guard for ADMIN + simple admin navigation bar at the top with links to Overview, Listings, Users, Donations, Settings

**2. Create admin API routes**:

- `GET /api/admin/listings?status=PENDING_VALIDATION` — returns all listings, optionally filtered by status
- `PATCH /api/admin/listings/[id]/validate` — takes `{ action, notes }` where action is `"APPROVED"`, `"REJECTED"`, or `"CHANGES_REQUESTED"`. It:
  1. Creates a `ListingValidation` record
  2. Updates the listing's `status`, `validationNotes`, `validatedAt`, `validatedBy`
  3. Sends notification + email to the recipient

**3. Create `src/app/admin/page.tsx`** — overview with stat cards: total users, total listings, pending validations (make this yellow if > 0), total adoptions, total donated

**4. Create `src/app/admin/listings/page.tsx`** — listing table with:
- Filter tabs: All | Pending | Validated | Rejected | Draft
- Each row shows: RHU name, status badge, recipient name/email, location, adoption count, "Review" link

**5. Create `src/app/admin/listings/[id]/page.tsx`** — full listing detail with:
- Recipient info card (name, email, organization, position, phone)
- Description card
- Receipt instructions card
- **ValidationPanel** — `"use client"` component with:
  - Notes textarea
  - Three buttons: Approve (green), Request Changes (yellow), Reject (red)
  - Each button calls `PATCH /api/admin/listings/[id]/validate` then `router.refresh()`
- Validation history list

### Checkpoint ✓
- Log in as admin → `/admin` shows platform stats
- `/admin/listings` shows all listings with filter tabs working
- Click a PENDING listing → approve it → status badge updates to VALIDATED
- Log in as recipient → listing shows VALIDATED status, validation notes are visible
- Check that the seeded listing (PENDING) can be approved

---

## Chunk 7 — Stripe Connect Onboarding (4 hrs)

### Goal
A recipient can connect their Philippine bank account via Stripe, required before donors can pay them.

### Concepts to understand first (30 min)

**Stripe Connect Express** works like this:
1. Your platform calls `stripe.accounts.create({ type: "express", country: "PH" })` → Stripe creates a sub-account
2. You call `stripe.accountLinks.create(...)` → Stripe returns a URL
3. You redirect the recipient to that URL → Stripe shows their own onboarding flow (identity, bank details)
4. When they finish, Stripe redirects them back to your `return_url`
5. Stripe sends a `account.updated` webhook when onboarding is complete

You store the `stripeAccountId` on the `RecipientProfile`. When a donor donates, you use `transfer_data: { destination: stripeAccountId }` to route the money directly to them.

**Two Stripe webhook endpoints** are needed:
- Standard: for payment events (checkout.session.completed, etc.)
- Connect: for account events (account.updated)

**⚠️ Webhook raw body**: Stripe verifies the webhook signature against the raw request body. In Next.js App Router, you **must** use `await req.text()` (not `req.json()`) in webhook handlers.

### Tasks

**1. Create `src/app/api/stripe/connect/account-link/route.ts`** — POST handler:
1. Check session is RECIPIENT
2. Get `RecipientProfile`
3. If no `stripeAccountId` yet: call `stripe.accounts.create({ type: "express", country: "PH", email, ... })`; save the new account ID to DB
4. Call `stripe.accountLinks.create({ account: id, type: "account_onboarding", refresh_url, return_url })`
5. Return `{ url: accountLink.url }`

**2. Create `src/app/api/stripe/connect/account/route.ts`** — GET handler:
- Fetches `stripe.accounts.retrieve(stripeAccountId)` and returns `{ connected, onboarded: account.details_submitted }`

**3. Create `src/app/api/stripe/connect/webhook/route.ts`** — POST handler:
```typescript
const body = await req.text()  // raw body — critical!
const sig = req.headers.get("stripe-signature")!
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_CONNECT_WEBHOOK_SECRET!)
if (event.type === "account.updated") {
  const account = event.data.object
  if (account.details_submitted) {
    await prisma.recipientProfile.updateMany({
      where: { stripeAccountId: account.id },
      data: { stripeOnboarded: true }
    })
  }
}
```

**4. Create `src/app/recipient/stripe-onboarding/page.tsx`** — `"use client"` page:
- Explanation of what Stripe onboarding is
- Bullet list of what's needed
- "Start Onboarding" button → calls `POST /api/stripe/connect/account-link` → redirects to returned URL

**5. Create `src/app/recipient/stripe-return/page.tsx`** — server component:
- Called after Stripe redirects back
- Calls `stripe.accounts.retrieve(stripeAccountId)` to check `details_submitted`
- If complete: updates DB, shows success message
- If incomplete: shows "continue onboarding" button

**6. Set up local webhook forwarding** (do this in a separate terminal while testing):
```bash
stripe listen --events account.updated --forward-to localhost:3000/api/stripe/connect/webhook
```
Copy the `whsec_...` printed and put it in `.env.local` as `STRIPE_CONNECT_WEBHOOK_SECRET`.

### Checkpoint ✓
- Log in as recipient → dashboard shows the orange "Stripe onboarding required" warning
- Click the onboarding link → redirected to Stripe's test onboarding
- Complete Stripe test onboarding → redirected back → success message
- Recipient dashboard: warning banner disappears

---

## Chunk 8 — Donation Flow (One-Time) (4 hrs)

### Goal
A donor can adopt an RHU and complete a one-time payment via Stripe Checkout. The donation is recorded in the database.

### Concepts to understand first (20 min)

**Stripe Checkout flow (one-time)**:
1. Donor clicks "Adopt" → your server creates a Stripe Checkout Session
2. You return the Checkout Session's `url` to the browser
3. Browser redirects to Stripe's hosted payment page (you never handle card data)
4. Donor pays → Stripe redirects to your `success_url`
5. Stripe fires `checkout.session.completed` webhook → your server marks the donation as COMPLETED

**Pre-create the Donation record (PENDING)** before redirecting. If the browser crashes after payment, the webhook still fires and you can update the record. Without pre-creating, you'd have nowhere to update.

**Destination charges** — the key Stripe Connect feature:
```typescript
payment_intent_data: {
  transfer_data: { destination: recipientStripeAccountId }
}
```
This tells Stripe to transfer the money to the recipient's connected account automatically.

### Tasks

**1. Create `src/app/donor/layout.tsx`** — role guard for DONOR

**2. Create `src/app/api/adoptions/route.ts`** — for now just a placeholder GET that returns donor's adoptions (we'll use this in Chunk 9)

**3. Create `src/app/api/stripe/checkout/route.ts`** — POST handler:
1. Verify session is DONOR
2. Get `listingId` and `isRecurring` from request body
3. Verify listing exists and `status === "VALIDATED"`
4. Verify `recipient.stripeOnboarded === true`
5. Get donation amount from `Setting` table (`donation_amount_cents`)
6. If `isRecurring: false` (one-time):
   ```typescript
   stripe.checkout.sessions.create({
     mode: "payment",
     payment_intent_data: { transfer_data: { destination: stripeAccountId } },
     line_items: [{ price_data: { ... amountCents ... }, quantity: 1 }],
     metadata: { donorId, listingId, isRecurring: "false" },
     success_url: `${BASE_URL}/donation/success?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${BASE_URL}/donation/cancel?listing_id=${listingId}`,
   })
   ```
7. Create `Adoption` record (status "ACTIVE") if one doesn't already exist
8. Create `Donation` record (status "PENDING", stripeSessionId = session.id)
9. Return `{ url: session.url }`

**4. Create `src/app/api/stripe/webhook/route.ts`** — POST handler handling these events for now:

`checkout.session.completed`:
- Find the Donation by `stripeSessionId`
- Update it to `status: "COMPLETED"`
- Create in-app notifications for donor and recipient
- Send emails to both

`checkout.session.expired`:
- Find the Donation by `stripeSessionId`
- Update it to `status: "FAILED"`

**5. Create `src/app/donor/adopt/[listingId]/page.tsx`** — server component:
- Fetches the listing (404 if not VALIDATED)
- Checks if donor already has an active adoption of this listing
- If yes: shows "already adopted" message with link to the adoption
- If no: shows the RHU summary card + `<AdoptionTypeSelector />` below

**6. Create `src/app/donor/adopt/[listingId]/AdoptionTypeSelector.tsx`** — `"use client"`:
- Two selection buttons: "One-Time" | "Monthly (cancel anytime)"
- Donation amount displayed prominently
- "Adopt" button → calls `POST /api/stripe/checkout` → `window.location.href = url`

**7. Create `src/app/donation/success/page.tsx`** — thank you page with links to dashboard

**8. Create `src/app/donation/cancel/page.tsx`** — "no charge made" page with retry link

**9. Set up local webhook forwarding**:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copy the webhook secret into `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### Testing the flow
1. Log in as donor
2. Go to `/rhu` → click an RHU → click Adopt
3. Complete payment with test card `4242 4242 4242 4242`, any future date, any CVC
4. Should land on `/donation/success`
5. In Prisma Studio, verify: `Adoption` table has a row, `Donation` table has `status: "COMPLETED"`

### Checkpoint ✓
- One-time donation completes end-to-end with Stripe test card
- Donation record shows COMPLETED in Prisma Studio
- Donor and recipient get notifications (check Notification table)

---

## Chunk 9 — Donor Dashboard & Recurring Donations (4 hrs)

### Goal
Donors can see all their adopted RHUs, view donation history, cancel monthly donations. Monthly recurring subscriptions work end-to-end.

### Concepts to understand first (20 min)

**Stripe Subscriptions** work differently from one-time payments:
- You create a `Price` object on the connected account (with `recurring: { interval: "month" }`)
- Pass that price to Checkout with `mode: "subscription"`
- Stripe charges the donor every month automatically
- Each monthly charge fires `invoice.payment_succeeded`
- If the donor cancels, Stripe fires `customer.subscription.deleted`

**Cancel a subscription**: `stripe.subscriptions.cancel(subscriptionId)` — call this from your server when the donor requests cancellation.

### Tasks

**1. Expand `src/app/api/adoptions/route.ts` GET** — return the current donor's adoptions with listing and donations included

**2. Create `src/app/api/adoptions/[id]/route.ts`** — GET single adoption (verify it belongs to the requesting donor or recipient)

**3. Create `src/app/api/adoptions/[id]/cancel/route.ts`** — POST handler:
1. Verify donor owns this adoption
2. If `stripeSubscriptionId` exists: call `stripe.subscriptions.cancel(id)`
3. Update `Adoption` status to `CANCELLED`, set `cancelledAt`
4. Notify both donor and recipient

**4. Expand `src/app/api/stripe/checkout/route.ts`** — add the recurring case (`isRecurring: true`):
```typescript
// Create a Price on the connected account
const price = await stripe.prices.create(
  { unit_amount: amountCents, currency: "usd", recurring: { interval: "month" }, product_data: { name: `...` } },
  { stripeAccount: destinationAccountId }
)
// Create subscription checkout session
stripe.checkout.sessions.create({
  mode: "subscription",
  line_items: [{ price: price.id, quantity: 1 }],
  subscription_data: { transfer_data: { destination: destinationAccountId } },
  ...
})
```

**5. Expand `src/app/api/stripe/webhook/route.ts`** — add these event handlers:

`checkout.session.completed` (update): if `isRecurring === "true"` in session metadata, also store `stripeSession.subscription` on the `Adoption` record.

`invoice.payment_succeeded`: for recurring renewals (not the first payment):
- Find adoption by `stripeSubscriptionId`
- Create a new `Donation` (COMPLETED) for this month's charge
- Notify and email both parties

`invoice.payment_failed`:
- Find adoption by `stripeSubscriptionId`
- Notify the donor their payment failed

`customer.subscription.deleted`:
- Find adoption by `stripeSubscriptionId`
- Mark it CANCELLED
- Notify and email both parties

**6. Create `src/app/donor/dashboard/page.tsx`** — server component:
- Stats: active adoptions, total adoptions, total donated
- Grid of adoption cards — each shows RHU name, location, status (ACTIVE/CANCELLED), one-time vs monthly, "View & Message" button

**7. Create `src/app/donor/adoptions/page.tsx`** — list view of all adoptions with status badges and amounts

**8. Create `src/app/donor/adoptions/[id]/page.tsx`** — adoption detail:
- Adoption stats (total donated, payment count, status)
- "Cancel Monthly Donation" button (only if recurring + active) — confirm before cancelling
- Message thread with recipient (placeholder for now — use `<MessageThread />` in Chunk 10)
- Donation history table

**9. Create `src/app/donor/adoptions/[id]/CancelAdoptionButton.tsx`** — `"use client"` with confirmation step before calling cancel API

### Checkpoint ✓
- Donor dashboard shows adopted RHUs from seed + any you tested
- Monthly donation checkout works with test card
- Cancel monthly → Adoption status changes to CANCELLED
- Prisma Studio shows new Donation records for each payment event

---

## Chunk 10 — Messaging (4 hrs)

### Goal
Donors and recipients can exchange messages about a specific adoption. New messages trigger notifications and emails.

### Concepts to understand first (20 min)

**Access control for messages**: Only two users should be able to read/write a message thread — the donor who created the adoption, and the recipient who owns the listing. Before returning or creating a message, verify that `session.user.id` matches one of these two.

**Polling**: Real-time messaging (WebSockets) is complex. For MVP, the `MessageThread` component polls `GET /api/adoptions/[id]/messages` every 15 seconds with `setInterval`.

### Tasks

**1. Create `src/app/api/adoptions/[id]/messages/route.ts`** — two handlers:

`GET`:
- Verify the requesting user is either the adoption's donor or listing's recipient
- Return all messages for this adoption (include sender name)
- Mark all messages from the other party as `isRead: true`

`POST`:
- Verify same access control
- Create the message
- Send notification + email to the other party (with a preview of the message content)

**2. Create `src/components/messaging/MessageThread.tsx`** — `"use client"` component:
```
Props: { adoptionId: string, currentUserId: string, compact?: boolean }
```

State:
- `messages: Message[]` — fetched from API
- `newMessage: string` — input text
- `sending: boolean`

Effects:
- `useEffect`: fetch messages on mount, then `setInterval(fetchMessages, 15000)` — clear on unmount
- `useEffect`: scroll to bottom ref when messages change

Render:
- Scrollable message list (max height 256px, overflow-y auto)
- Each message: right-aligned if mine (emerald bubble), left-aligned if theirs (white bubble)
- Below the list: text input + send button
- `compact` mode: show latest message preview + "View conversation (N)" link

**3. Wire up MessageThread in donor adoption detail** (`/donor/adoptions/[id]/page.tsx`)

**4. Wire up MessageThread in recipient listing detail** (`/recipient/listings/[id]/page.tsx`) — grouped by adoption (one thread per donor)

### Checkpoint ✓
- Log in as donor → open an adoption → send a message
- Log in as recipient → open the listing → see the message, reply
- Notifications appear in the bell icon for both parties
- Both receive emails (check console logs if Resend key isn't set yet)

---

## Chunk 11 — Email Notifications & Notification Bell (4 hrs)

### Goal
The notification bell shows unread counts, clicking it marks them read. Transactional emails send on all key events.

### Concepts to understand first (15 min)

**In-app notifications**: Stored in the `Notification` table. The bell component polls `GET /api/notifications` every 30 seconds. When the user opens the bell, it calls `PATCH /api/notifications/read-all`.

**Resend**: A simple email API. Sign up at resend.com, get an API key, add a verified domain (or use their sandbox for testing). The SDK call is just:
```typescript
await resend.emails.send({ from, to, subject, html })
```

### Tasks

**1. Create notification API routes**:

- `GET /api/notifications` — returns current user's last 30 notifications
- `PATCH /api/notifications/read-all` — marks all as `isRead: true`

**2. Create `src/components/layout/NotificationBell.tsx`** — `"use client"` component:
- State: `notifications`, `open`
- Poll notifications every 30 seconds with `useEffect`
- Red badge on bell showing unread count (hide if 0)
- Clicking bell: toggle dropdown + mark all read
- Dropdown list: up to 20 notifications, each shows title, body, date, link if present

**3. Add NotificationBell to `NavbarClient.tsx`** — only when user is logged in

**4. Verify all `createNotification` calls are in place** — you should have them in:
- `/api/register` — WELCOME
- `/api/stripe/webhook` — ADOPTION_CREATED (for both donor and recipient), DONATION_FAILED, SUBSCRIPTION_RENEWED, SUBSCRIPTION_CANCELLED
- `/api/adoptions/[id]/cancel` — ADOPTION_CANCELLED (for both)
- `/api/admin/listings/[id]/validate` — LISTING_VALIDATED or LISTING_REJECTED
- `/api/adoptions/[id]/messages` — MESSAGE_RECEIVED

**5. Verify all `sendEmail` calls exist alongside each `createNotification` call**

**6. Test emails**: If you have a Resend API key and verified domain, emails will send. Otherwise, add `console.log` in `sendEmail()` to verify the function is being called with the right content.

### Checkpoint ✓
- Bell icon shows a red badge after any event (register, message, adoption, etc.)
- Clicking the bell shows notifications, badge disappears
- Email HTML content is correct (test by logging it if no Resend key)

---

## Chunk 12 — Polish, Admin Complete & Production Prep (4 hrs)

### Goal
All admin pages complete. Error handling in place. App ready to deploy.

### Tasks

**1. Create remaining admin pages**:

- `src/app/admin/users/page.tsx` — table of all users with name, email, role, join date
- `src/app/admin/donations/page.tsx` — table of all donations with donor, RHU, amount, status
- `src/app/admin/settings/page.tsx` — form to change `donation_amount_cents`

Admin API routes needed:
- `GET /api/admin/users`
- `GET /api/admin/donations`
- `GET /api/admin/settings`
- `PATCH /api/admin/settings` — upsert the setting

**2. Create loading, error, and not-found pages**:
- `src/app/loading.tsx` — spinner
- `src/app/error.tsx` — `"use client"`, shows error message + retry button
- `src/app/not-found.tsx` — 404 message + go home button

**3. Run a full TypeScript check**:
```bash
npx tsc --noEmit
```
Fix all errors before moving on.

**4. Run production build**:
```bash
npm run build
```
Fix any build errors. A clean build is required before deployment.

**5. Switch to PostgreSQL for production**:
- Sign up for a free PostgreSQL database at [neon.tech](https://neon.tech) (free tier works great)
- Change `prisma/schema.prisma`: `provider = "sqlite"` → `provider = "postgresql"`
- Set `DATABASE_URL` in your production env vars to the Neon connection string
- Run: `npx prisma migrate deploy` (applies all migrations to production DB)
- Run: `npx prisma db seed` (creates admin user and settings)

**6. Deploy to Vercel**:
- Push your code to GitHub
- Connect the repo at [vercel.com](https://vercel.com)
- Add all environment variables from `.env.local` (use production values)
- Update `NEXTAUTH_URL` and `NEXT_PUBLIC_BASE_URL` to your production domain
- Deploy

**7. Register Stripe webhook endpoints in Stripe Dashboard**:
- `https://yourdomain.vercel.app/api/stripe/webhook`
  - Events: `checkout.session.completed`, `checkout.session.expired`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`
- `https://yourdomain.vercel.app/api/stripe/connect/webhook`
  - Events: `account.updated`
- Copy the webhook signing secrets to your Vercel environment variables

**8. Final smoke test** (do this in production):
- [ ] Register as donor → browse RHUs → no login needed
- [ ] Register as recipient → create listing → submit → admin approves → visible publicly
- [ ] Recipient completes Stripe onboarding
- [ ] Donor adopts RHU (one-time) → Stripe checkout → donation shows COMPLETED
- [ ] Donor adopts RHU (monthly) → cancel → Adoption CANCELLED
- [ ] Donor messages recipient → notification + email to recipient
- [ ] Admin changes donation amount → new adoptions use new amount
- [ ] Non-admin trying to access `/admin` → redirected to login

### Checkpoint ✓
- `npm run build` passes with 0 errors
- App is deployed and all 8 smoke test steps pass

---

## Reference Files

The complete, working version of this project is at:
```
C:\Users\Bio\donation-platform\
```

Use it to:
- Check how a specific component should look
- Understand a Prisma query pattern
- Verify an API route structure
- Unblock yourself when stuck

**But try to write each piece yourself first.** When you look at the reference, understand *why* it's written that way before copying it.

---

## Common Mistakes to Avoid

| Mistake | Fix |
|---|---|
| Using `req.json()` in webhook handlers | Always use `req.text()` for raw body |
| Storing money as decimal (e.g. `9.99`) | Always store cents as integer (`999`) |
| Not adding `"use client"` to components with event handlers | Any component using `useState`, `onClick`, `signIn`, etc. needs `"use client"` |
| Multiple Prisma clients in dev mode | Use the global singleton pattern in `lib/prisma.ts` |
| Forgetting `router.refresh()` after server-side data changes | Call it after any mutation to re-fetch server component data |
| Hardcoding donation amount | Always read from the `Setting` table |
| Using `seq.user.id` for DonorProfile queries | `session.user.id` is the User ID; get DonorProfile via `findUnique({ where: { userId: session.user.id } })` |

---

## Asking Claude for Help

When you're stuck, give Claude:
1. **What you're trying to do**: "I'm building the `/api/stripe/checkout` route"
2. **What you have so far**: paste your current code
3. **What's going wrong**: error message, unexpected behavior, or what you don't understand

The more context you give, the better the help.
