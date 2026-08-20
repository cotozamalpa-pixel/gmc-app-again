# Muzenza Group Polska — Student Portal, Attendance & Store

A full-stack Next.js app (App Router + TypeScript + Prisma/PostgreSQL) for a capoeira school:

- **Student accounts**: name, surname, apelido, belt (from an admin-managed graduation
  system), city/section, training start date, birth date.
- **Roles**: Aluno, Graduado, Monitor, Instrutor, Professor, Contramestre, Mestre, Admin.
- **Admin panel**: manage students & roles, pause/resume a student's training timeline,
  manage the belt/graduation system, manage cities/sections, manage the product catalog,
  manage orders.
- **Attendance**: a signed daily QR code per city (shown by teaching staff), students scan
  it (or type the code) while logged in to check into class. Weekly/monthly/yearly calendar
  views for students and admins.
- **Store**: t-shirts, hoodies, etc. Each product is scoped to specific sections; a student
  can only buy products scoped to **their own city** or the **default Polish national
  section** — enforced both in the UI and server-side on order creation.

## 1. Requirements

- Node.js 20+
- A PostgreSQL database (e.g. [Neon](https://neon.tech), [Supabase](https://supabase.com),
  Railway, or your own server)

## 2. Local setup

```bash
npm install
cp .env.example .env
# edit .env: set DATABASE_URL, NEXTAUTH_SECRET, QR_SIGNING_SECRET, and the seed admin
#   - generate secrets with: openssl rand -base64 32

npx prisma migrate dev --name init
npm run seed        # creates default belts, the Polish default section, and the admin account
npm run dev
```

Visit `http://localhost:3000`. Log in with the admin credentials from your `.env`
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`) to reach `/admin`.

## 3. Deploying (Vercel + Neon, free tier friendly)

1. Push this project to a GitHub repo.
2. Create a free Postgres database at [neon.tech](https://neon.tech) (or Supabase/Railway) and
   copy its connection string.
3. Go to [vercel.com](https://vercel.com) → New Project → import your repo.
4. In **Environment Variables**, add:
   - `DATABASE_URL` — your Postgres connection string
   - `NEXTAUTH_URL` — your production URL, e.g. `https://your-app.vercel.app`
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `QR_SIGNING_SECRET` — `openssl rand -base64 32`
5. Deploy. Then run migrations + seed against the production database once, from your
   machine (with `DATABASE_URL` pointed at production in your local `.env`):
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```
6. Log in with the seeded admin account and change its password by registering the real
   admin's details, or update it directly via Prisma Studio (`npx prisma studio`).

## 4. How the pieces fit together

- **Graduation system**: `/admin/belts` lets the admin define belts (name, color, order).
  Students pick from this list at registration and admins can reassign it any time.
- **Paused timelines**: `/admin/users` → "Active — pause" toggles `User.isPaused`. While
  paused, a student cannot check into class (`/api/attendance/checkin` rejects it), and
  the accumulated paused duration (`totalPausedDays`) is subtracted from their training
  timeline shown on the dashboard.
- **Daily QR attendance**: `/api/qrcode/today` generates (once per city per day) an
  HMAC-signed token — teaching staff (Monitor and above) display it on `/scan`. The token
  itself doesn't identify a student; each student scans it under their own logged-in
  session, and `/api/attendance/checkin` records one `AttendanceRecord` per student per
  day. This means a screenshot of the code is harmless (everyone still checks in as
  themselves), while a tampered/forged code is rejected by signature verification.
- **Store city restriction**: every `Product` has a list of `City` records it's sold to.
  `/api/products` (list) and `/api/orders` (checkout) both re-check server-side that the
  buyer's city — or the section flagged `isDefaultSection` — is in that list, so this
  can't be bypassed from the browser.

## 5. What you'll likely want to extend

- **Payments**: checkout currently creates a `PENDING` order for pay-on-pickup/bank
  transfer, and admins move it through `PAID → READY_FOR_PICKUP → COMPLETED` from
  `/admin/orders`. To accept cards, add Stripe Checkout (or a local provider like
  Przelewy24, common in Poland) at the "Place order" step in
  `src/app/checkout/page.tsx`, and have your webhook flip the order to `PAID`.
- **Product images**: `Product.imageUrl` currently expects a hosted image URL. Add file
  upload (e.g. to S3 or Vercel Blob) if you want admins to upload photos directly.
- **Notifications**: hook an email/SMS provider into pause/resume and order-status changes
  if you want students notified automatically.
- **Belt progression rules**: the timeline calculation on the dashboard is a simple
  "days since start minus paused days" — extend `src/app/dashboard/page.tsx` if Muzenza's
  actual graduation rules are more specific (e.g. minimum class count per belt).

## 6. Project structure

```
prisma/schema.prisma       Data model (users, belts, cities, attendance, products, orders)
prisma/seed.ts              Seeds default belts, Polish section, admin account
src/lib/auth.ts             NextAuth config (credentials + role/city in session)
src/lib/roles.ts            Role list + permission helpers
src/lib/qrcode-token.ts     Signs/verifies the daily attendance QR tokens
src/middleware.ts           Route guards (login required / admin required)
src/app/(auth)/...          Login & registration
src/app/dashboard/...       Student home, profile, attendance calendar
src/app/scan/               QR display (staff) + scanner (students)
src/app/store/, cart/, checkout/, orders/   The apparel store
src/app/admin/...           Admin panel (users, belts, cities, attendance, products, orders)
src/app/api/...             All backend routes backing the above
```
