```markdown
# Architecture: استوديو أوركست (Orchest Studio)

<!--
The map of how Orchest Studio is built and how its parts connect.
The agent can read your files. It cannot read the decisions behind them.
Write those down here. When the structure changes, update this file in
the same commit.
-->

## 01 System overview

One level above the code. Boxes and arrows, not modules.


```

Client (Mobile / Desktop Browser)
|
v
Frontend (Next.js App Router + Audio Context) -----> Auth Provider (Admin Only)
|
v
Backend API (Route Handlers / Server Actions)
|
+---> Database (Supabase PostgreSQL / Drizzle ORM)
+---> Cloud Storage (Cloudflare R2 / S3-compatible for Audio/Thumbnails)
+---> AI Engine (Google GenAI / Gemini 1.5 Flash via Server-Side SDK)
+---> WhatsApp Outbound (Direct wa.me protocol dispatch via client)

```

- Users interact with the frontend as guest listeners without requiring accounts.
- The frontend never talks to PostgreSQL or Cloudflare R2 credentials directly; all writes and administrative mutations flow through the Next.js API layer.
- Third-party AI and cloud storage API keys live strictly in server environment variables (`GEMINI_API_KEY`, `R2_SECRET_KEY`) and are never bundled to the client.

## 02 Tech stack

| Layer | Choice | Why this, not the obvious alternative |
| --- | --- | --- |
| Frontend | Next.js (App Router, TypeScript) | SSR/SSG ensures fast indexing and schema markup for Google SEO on tracks; React Context manages persistent audio without route teardown. |
| Styling | Tailwind CSS + CSS Tokens | Strict adherence to `DESIGN_SYSTEM.md` tokens; instant `[data-theme]` switching between Dark Luxury and Light mode with zero runtime penalty. |
| Audio Engine | Web Audio API / WaveSurfer.js + Facade Embeds | Renders real-time waveforms for uploaded audio files and handles YouTube embeds without killing the persistent sticky audio session. |
| Backend | Next.js Route Handlers (`src/app/api/`) | Eliminates the need for a separate Node/Express backend; keeps deployment, types, and server-side secret handling unified. |
| Database | PostgreSQL (via Supabase) | Native relational schema for tracks, categories, order click logs, and analytics; supports vector embeddings (`pgvector`) if semantic search scales. |
| Queries | Drizzle ORM | Lightweight, type-safe SQL-first queries without the heavy overhead, cold-start latency, or engine bloat of Prisma. |
| Auth (Admin) | Supabase Auth (or Iron-Session for Admin Dashboard) | Authenticates only the studio owner for the dashboard; guest visitors require zero authentication. |
| File Storage | Cloudflare R2 | S3-compatible audio and image storage with zero egress bandwidth fees, critical for audio streaming with high listening volumes. |
| AI Integration | Google GenAI SDK (`gemini-1.5-flash`) | Fast, cost-efficient server-side execution for semantic intent matching, SEO title/description generation, and the studio AI concierge. |
| Hosting | Vercel | Seamless edge caching, ISR for track pages, and instant Next.js App Router optimization. |
| Testing | Vitest + Playwright | Vitest for unit testing pure utility helpers (WhatsApp string builders, schema formatters); Playwright for critical mobile funnel checkout flows. |

Do not add a dependency that overlaps with a row in this table without asking.

## 03 Project structure


```

/
AGENTS.md            agent instructions (read first)
docs/                PRD.md, DESIGN_SYSTEM.md, ARCHITECTURE.md
src/
app/               Next.js App Router (pages and API route handlers only)
(public)/        visitor routes: /, /tracks/[slug], /category/[slug], /about
admin/           admin dashboard routes: /admin, /admin/tracks, /admin/settings
api/             API routes: /api/tracks, /api/ai/seo, /api/settings, /api/backup
components/
ui/              primitives: Button, Input, Modal, Badge, Sheet (see DESIGN_SYSTEM.md)
player/          AudioPlayerProvider, StickyPlayer, WaveformVisualizer
features/        TrackCard, TrackGrid, WhatsAppOrderModal, AIConciergeWidget, AdminMediaUploader
context/           AudioContext (global audio playback state across route transitions)
lib/
db/              schema.ts, migrations, db client connection
services/        tracks.ts, analytics.ts, settings.ts, backup.ts, ai.ts
integrations/    r2.ts (storage), gemini.ts (AI Studio SDK), supabase.ts
utils/           formatters.ts, whatsapp.ts (message generator), seo.ts
types/             shared TypeScript interfaces (Track, Category, AnalyticsEvent)
public/              static brand assets and fallbacks
tests/               e2e mobile conversion tests

```

Where new code belongs:
- A new page or route: `src/app/(public)/<route>/page.tsx` or `src/app/admin/<route>/page.tsx`. Thin wrapper calling a service.
- Audio playback logic: `src/context/AudioContext.tsx` or `src/components/player/`.
- Business rules & database access: `src/lib/services/<domain>.ts`.
- Third-party client initialization (Gemini, R2, Storage): `src/lib/integrations/<vendor>.ts`, invoked by a service, never directly by client components.
- WhatsApp message formatting logic: `src/lib/utils/whatsapp.ts`.
- UI primitives: `src/components/ui/`, adhering strictly to `DESIGN_SYSTEM.md`.

## 04 Data flow

Request path for track playback and WhatsApp conversion:
1. User clicks "تشغيل" (Play) on a track card.
2. `AudioContext` receives track metadata and audio URL, mounting or updating the `StickyPlayer` component.
3. An asynchronous event fires to `/api/analytics/event` with `event_type: 'play'` (debounced to avoid spam).
4. User clicks "اطلب هذه الزفة باسمك" (Order via WhatsApp), opening the `WhatsAppOrderModal`.
5. User enters customer names and event date; clicking "إرسال الطلب عبر واتساب" triggers `logOrderIntent` service.
6. System logs the conversion row in `order_logs` table and fetches the current active WhatsApp number from `site_settings`.
7. Formatted dynamic `wa.me` URL opens in a new tab/application.

Data flow for Admin AI SEO generation:
1. Studio owner enters track title, vocalist, and category in the Admin Dashboard and clicks "توليد تلقائي ✨".
2. Admin frontend sends payload to `/api/ai/seo`.
3. Route verifies admin session and calls `src/lib/services/ai.ts`.
4. `ai.ts` invokes Google Gemini using `gemini-1.5-flash` with structured JSON output schema.
5. Generated `meta_title`, `meta_description`, and marketing tags return to the form fields for manual review before saving.

State:
- Audio playback state (currently playing track, progress, play/pause, volume) lives in `AudioContext` wrapped at the root layout.
- Server data (tracks, categories, analytics) is fetched per request via React Server Components (RSC) and cached with ISR.
- Form drafts and modal states live in local component state.
- No optimistic updates for database backups or WhatsApp number setting updates; UI waits for server response confirmation.

Errors:
- User-facing audio playback failures trigger a clean toast: "تعذر تشغيل المقطع الصوتي، يرجى إعادة المحاولة".
- Form validation errors appear inline in red below inputs.
- Server route errors log internal stack traces on the server but return sanitized `{ error: "حدث خطأ غير متوقع" }` with an HTTP status code.

## 05 Boundaries

Dependencies flow one way: `app -> components -> services -> db / integrations`.

Allowed:
- Page components import UI components, player components, and domain services.
- Domain services (`src/lib/services/*`) import database queries and integration clients (`r2.ts`, `gemini.ts`).
- Client components consume `AudioContext` and trigger API routes via `fetch`.

Never:
- Client components import `src/lib/db/*` or use server database clients directly.
- Server-side API keys (`GEMINI_API_KEY`, storage credentials) leaked into `NEXT_PUBLIC_*` variables.
- Audio playback interrupted or re-instantiated upon internal Next.js client-side route navigations (`<Link>`).
- Direct mutation of WhatsApp settings without going through admin authentication checks.

## 06 Decisions that look wrong but are intentional

The agent must not "fix" or change these:

- **WhatsApp checkout instead of native Stripe/card checkout:** Intentional. High-ticket custom audio tracks and GCC zaffat rely entirely on human coordination, personalized vocal recording, and direct negotiation via WhatsApp.
- **Audio state held in React Context at the Root Layout rather than inside route pages:** Intentional. If audio state lived inside individual page routes, changing pages would abruptly cut off the customer's listening session.
- **Persisting plain WhatsApp order click events without requiring customer sign-in:** Intentional. Forcing visitors to register an account before requesting a track on WhatsApp drops conversion rates by over 70%.
- **Storing custom fields in JSONB or snapshot columns in `order_logs` instead of strict foreign relational joins:** Intentional. If a track is renamed or deleted by the studio in the future, past lead logs must keep the exact track title and code captured at the moment of order intent.
- **Direct client-side navigation to `wa.me` URL rather than server-side redirects:** Intentional. Mobile browsers frequently block programmatic server-side redirects to external URI schemes like WhatsApp as popup spam; opening directly from the user click gesture ensures reliable app switching.

## 07 Scalability and future considerations

- Expected scale for v1: 500 to 2,000 daily active listeners, 100 to 500 catalog tracks, 50 to 150 daily WhatsApp order leads.
- Media storage: Cloudflare R2 provides zero egress fees, removing bandwidth cost spikes as listening hours grow.
- Audio caching: Static audio files are delivered through Cloudflare CDN edges with long-lived `Cache-Control: public, max-age=31536000` headers.
- Known limits: Single database instance (Supabase PostgreSQL pool); backups are generated on-demand as JSON/CSV downloads rather than scheduled automated multi-region snapshots in v1.
- Planned for v2: Multi-regional CDN streaming optimization, automatic Telegram notification webhook to the studio owner whenever an order modal is submitted, and automated bulk MP3 ID3 tag extraction.
- Not planned: Multi-tenant SaaS capability (the platform is solely dedicated to Orchest Studio), client customer user login dashboards, or in-browser audio DAW editing.

## 08 When the agent must stop and ask

If a task requires any of the following, stop, name the architectural conflict, and propose the smallest change that avoids it:
- Introducing mandatory customer authentication or account creation for listening/ordering.
- Replacing the client-side `wa.me` flow with a forced in-app payment gateway.
- Changing `AudioContext` architecture in a way that restarts audio playback on page navigation.
- Adding heavyweight backend libraries (like Prisma or Express) that duplicate existing Next.js / Drizzle setups.
- Exposing any admin functionality or backup endpoints without server-side authentication validation.

```
