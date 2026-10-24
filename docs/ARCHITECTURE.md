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
Frontend (TanStack Start + React + Audio Engine) -----> Auth Provider (Admin Only)
|
v
Backend API (Nitro + Express-compatible shim)
|
+---> Database (Supabase PostgreSQL + Supabase JS)
+---> Cloud Storage (Supabase Storage for Audio/Thumbnails)
+---> AI Engine (Lovable AI Gateway via server-side shim)
+---> WhatsApp Outbound (Direct wa.me protocol dispatch via client)

```

- Users interact with the frontend as guest listeners without requiring accounts.
- The frontend uses only the browser-safe Supabase key for public reads; all writes and administrative mutations flow through the Nitro API layer and service-role client.
- Third-party AI, Supabase service-role, YouTube OAuth, and Web Push secrets live strictly in server environment variables and are never bundled to the client.

## 02 Tech stack
| Layer | Choice | Why this, not the obvious alternative |
| --- | --- | --- |
| Frontend | TanStack Start + TanStack Router + React | SSR, file-based routing, and persistent client audio state. |
| Styling | Tailwind CSS 4 + CSS tokens | Shared light/dark visual system and responsive RTL layout. |
| Audio Engine | Browser Audio API + Media Session | Persistent playback across internal navigation without a heavyweight player dependency. |
| Backend | Nitro server entry + Express-compatible shim | One server path for auth, catalog writes, gifts, AI, YouTube, and Push. |
| Database | Supabase PostgreSQL | RLS, Storage, Auth integration, and typed JS client. |
| Auth (Admin) | Supabase Auth + HMAC-signed HttpOnly session | Admin allowlist, CSRF, TTL, and server-only mutations. |
| File Storage | Supabase Storage | Audio, artwork, gift media, and signed access paths. |
| AI Integration | Lovable AI Gateway through the server | Grounded public concierge and admin assistant without exposing provider keys. |
| Hosting | Vercel Node.js runtime | Compatible with Nitro SSR and the `web-push` Node package. |
| Testing | Vitest + jsdom | Fast unit and component coverage for critical business rules. |

Do not add a dependency that overlaps with a row in this table without asking.
## 03 Project structure
```
/
├── src/routes/                 # TanStack file routes, SSR head, API catch-all
├── src/orchest/                # Public app, admin dashboard, services, server API
├── src/pwa/                    # Service Worker registration and install lifecycle
├── src/integrations/supabase/  # Browser/server clients and generated types
├── public/                     # PWA, SEO, logo, and offline assets
├── supabase/migrations/        # Ordered database migrations
├── scripts/                    # Build-time SEO asset generation
├── docs/                       # Product, design, and architecture documentation
├── package.json
└── vite.config.ts
```
Where new code belongs:
- A public or admin page: `src/routes/` or `src/orchest/components/`.
- Business/database access: `src/orchest/services/` and `src/orchest/server/api.ts`.
- Server-only integrations: `src/orchest/server/` and `src/integrations/supabase/client.server.ts`.
- PWA lifecycle: `src/pwa/` and `public/sw.js`.
- Static brand/SEO assets: `public/`.

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
- Server-side API keys (service role, AI, YouTube, Push) leaked into `VITE_*` variables.
- Audio playback interrupted or re-instantiated upon internal TanStack client-side route navigations (`<Link>`).
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
- Media storage: Supabase Storage is the current source of truth; CDN optimization can be added after measuring real traffic.
- Audio caching: Static audio files are delivered through Cloudflare CDN edges with long-lived `Cache-Control: public, max-age=31536000` headers.
- Known limits: Single database instance (Supabase PostgreSQL pool); backups are generated on-demand as JSON/CSV downloads rather than scheduled automated multi-region snapshots in v1.
- Planned for v2: Multi-regional CDN streaming optimization, automatic Telegram notification webhook to the studio owner whenever an order modal is submitted, and automated bulk MP3 ID3 tag extraction.
- Not planned: Multi-tenant SaaS capability (the platform is solely dedicated to Orchest Studio), client customer user login dashboards, or in-browser audio DAW editing.

## 08 When the agent must stop and ask

If a task requires any of the following, stop, name the architectural conflict, and propose the smallest change that avoids it:
- Introducing mandatory customer authentication or account creation for listening/ordering.
- Replacing the client-side `wa.me` flow with a forced in-app payment gateway.
- Changing `AudioContext` architecture in a way that restarts audio playback on page navigation.
- Adding heavyweight backend libraries (like Prisma or a second server framework) that duplicate the existing Nitro/Supabase setup.
- Exposing any admin functionality or backup endpoints without server-side authentication validation.

```
