# Conferentia v3 — Migration Analysis & Architecture Decision Record

## Context

**Conferentia** is an academic event management platform providing a paperless, digital experience for conference attendees and organizers. Two iterations exist:

- **v1** (Ionic 3 / Angular 5 / PHP / MySQL): 18 pages, 7 components, 14+ services. Core: schedule browsing, QR attendance, speakers, sponsors, competitions, geolocation. Backend: PHP with direct SQL (SQL injection, plaintext passwords).
- **v2** (Ionic 6 / Angular 14 / NestJS 9 / Sanity CMS): 13 pages, 6 components, 8+ services. Added: abstract submission + PDF upload, peer review workflow, admin dashboard, Auth0, connector-based backend.

**Goal:** Build **Conferentia v3** on `angular-nx-standalone-starter` (Angular 21, Nx 22, Hono, Drizzle ORM, PostgreSQL, Vitest, TailwindCSS v4). This document is an **architecture analysis** — not a code plan — detailing every decision, its tradeoffs, and alternatives considered.

**Source repos:**

- v1: `https://github.com/rolivencia/conferentia-v1`
- v2: `https://github.com/rolivencia/conferentia`
- Starter: `https://github.com/ResetShop/angular-nx-standalone-starter`

---

## 1. Feature Consolidation Analysis

### 1.1 What Carries Forward from Both Iterations

| Feature         | v1 Implementation                                                                            | v2 Implementation                                          | v3 Decision                                   | Rationale                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Event schedule  | `MiCronogramaPage` — tab-based, date/type/area filtering, search, favorites via localStorage | `SchedulePage` — simpler, activity cards, dayjs formatting | **Carry forward**, merging best of both       | v1's filtering UX + v2's cleaner component architecture. Schedule is the primary user flow. |
| Activity detail | `ActividadPage` — shows speakers, description, type, location, attendance counter            | `ActivityPage` — similar but simpler                       | **Carry forward**                             | Core feature in every conference app.                                                       |
| Speakers        | `DisertantesPage` — alphabetical sort, gender-based random avatars                           | `InvitedSpeakersPage` — `ParticipantCardComponent`         | **Carry forward**                             | Universal conference requirement. v2's "participant" naming is more inclusive.              |
| Committee       | `ChairsPage` — inline card layout                                                            | `CommitteesPage` — similar                                 | **Carry forward**                             | Standard conference information.                                                            |
| Sponsors        | `SponsorsPage` — local caching with timestamp sync                                           | v2 has sponsor model but no dedicated page                 | **Carry forward**                             | Revenue source visibility. Add tier-based display (platinum/gold/silver/bronze).            |
| Auth            | `InicioSesionPage` — JWT with plaintext password in localStorage                             | `RegistrationPage` — Auth0 OAuth2                          | **Carry forward** using starter's Paseto auth | See Section 5.5 for detailed auth analysis.                                                 |
| User profile    | `PerfilPage`                                                                                 | `IonicPagesModule` profile                                 | **Carry forward**                             | Users need to manage their data.                                                            |
| i18n            | `@ngx-translate` (ES/EN JSON files)                                                          | None                                                       | **Carry forward**                             | Starter already has i18n provider infrastructure. Academic events are international.        |

### 1.2 Features Unique to v1 — Carry/Drop Analysis

| Feature                      | v1 Implementation                                                                                                                                              | Decision                          | Tradeoff Analysis                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **QR attendance**            | `AsistenciaPage` — `@ionic-native/barcode-scanner` (Cordova), `ng-qrcode` for display. Organizers generate QR, attendees scan. Entry/exit timestamps recorded. | **Carry forward** (Web API)       | **Why carry:** Core differentiator — enables real-time attendance tracking without paper sign-in sheets. **Tradeoff:** Moving from Cordova barcode-scanner to Web MediaDevices API means (a) slightly lower scan performance on older mobile browsers, (b) no hardware button integration. **Mitigation:** jsQR library is mature; camera access via `getUserMedia()` is supported on 97%+ of browsers. The upside — no Cordova/Capacitor dependency — outweighs the marginal performance loss. |
| **Next activity countdown**  | `ProximaActividadPage` — `Observable.interval(100)` polling                                                                                                    | **Carry forward**                 | **Why carry:** High-value UX at low implementation cost. **Change:** Replace `Observable.interval` polling with Angular signals + `setInterval` (simpler, no RxJS dependency for a timer).                                                                                                                                                                                                                                                                                                      |
| **Competitions / standings** | `CompetitionsPage` — teams, points, rankings loaded from backend                                                                                               | **Carry forward**                 | **Why carry:** Gamification drives engagement. Not all conferences use it, but it's low-effort to make optional per event. **Tradeoff:** Adds 4 DB tables (competition, team, team_member, team_score). Worth it for feature completeness. Make it toggleable per event via `event.features_enabled` JSON column.                                                                                                                                                                               |
| **Venue maps**               | `MapaCiudadPage` + `MapaInstalacionesPage` — Google Maps via `@ionic-native/google-maps` + `@ionic-native/geolocation`                                         | **Carry forward** (Leaflet)       | **Why carry:** Navigation to venue rooms is a real pain point at large conferences. **Why Leaflet over Google Maps:** (a) No API key cost, (b) OSS with no vendor lock-in, (c) lighter bundle size (~40KB vs ~200KB), (d) custom tile providers (OpenStreetMap). **Tradeoff:** Google Maps has better satellite imagery and indoor maps. Leaflet requires more manual work for indoor floor plans. **Decision:** Leaflet for outdoor; simple SVG/image overlays for indoor venue maps.          |
| **Thematic areas**           | `AreasTematicasPage` — categorizes activities by academic discipline                                                                                           | **Carry forward**                 | Also exists in v2 as `SubjectArea`. Universal in academic events — papers and talks are organized by research area.                                                                                                                                                                                                                                                                                                                                                                             |
| **Favorites**                | localStorage-based, no backend sync                                                                                                                            | **Carry forward** (server-synced) | **Why server-sync:** Users access the app from multiple devices (laptop for planning, phone at the event). localStorage-only favorites don't roam. **Tradeoff:** Requires `user_favorite` table + API endpoint. Worth it for multi-device UX.                                                                                                                                                                                                                                                   |
| **Push notifications**       | OneSignal via `@ionic-native/onesignal`                                                                                                                        | **Carry forward** (Web Push API)  | **Why Web Push over OneSignal:** (a) No vendor dependency, (b) no SDK bundle cost, (c) browser-native. **Tradeoff:** OneSignal provides analytics dashboard and cross-platform targeting. **Mitigation:** Build minimal notification admin in the admin dashboard. Web Push is sufficient for "next session starting in 10 minutes" and announcements.                                                                                                                                          |

### 1.3 Features Unique to v2 — Carry/Drop Analysis

| Feature                      | v2 Implementation                                                                                                         | Decision                           | Tradeoff Analysis                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Abstract submission**      | `AbstractSubmissionPage` — multi-author form, PDF upload via `FileInterceptor` (Multer) to Sanity assets, status tracking | **Carry forward**                  | **Why carry:** This is the most complex academic workflow. Conferences require paper submission, review, and acceptance. **Changes:** (a) Replace Sanity asset storage with S3-compatible object storage (MinIO for self-hosted or AWS S3), (b) Add proper state machine for abstract status transitions, (c) Zod validation on all inputs.                                  |
| **Abstract review**          | `AbstractReviewPage` — reviewer comments, status update                                                                   | **Carry forward** (improved)       | **Why improve:** v2's review is simple (single reviewer, binary accept/reject). Academic conferences typically need (a) multiple reviewers per abstract, (b) scoring rubrics, (c) conflict-of-interest detection. **v3 scope:** Start with v2's simplicity (single reviewer), design the schema to support multiple reviewers later. Don't over-engineer in initial release. |
| **Admin dashboard**          | `AdminDashboardPage` — basic abstract management                                                                          | **Carry forward** (expanded)       | **Why expand:** v2's admin is minimal. Organizers need CRUD for events, activities, speakers, sponsors. **Tradeoff:** More pages = more development time. **Mitigation:** The starter's `data-table` + CRUD pattern means each admin page is structurally similar. Use the role/permission admin pages as templates.                                                         |
| **Multi-event architecture** | v2's `EventService` with `currentEvent$` BehaviorSubject, event-scoped API calls                                          | **Carry forward**                  | **Why:** One deployment serves multiple conferences. Reduces operational burden (no redeploy per event). **Tradeoff:** Every query needs `event_id` filtering, which adds complexity. **Mitigation:** `eventContextGuard` on routes loads event into store; all API services include `eventId` automatically.                                                                |
| **Travel information**       | `TravelInformationPage` — static content                                                                                  | **Carry forward** (as CMS content) | Store as markdown in `event_content` table. Editable from admin without code changes.                                                                                                                                                                                                                                                                                        |
| **Contact form**             | `ContactPage` — frontend form, no backend endpoint existed                                                                | **Carry forward** (with backend)   | v2 had no backend for this. v3 adds a `contact` API module that sends email via the starter's `EmailService`.                                                                                                                                                                                                                                                                |

### 1.4 Features to Deprecate — Justification

| Feature                          | Deprecation Reason                                                                                                                                       | Alternative                                                                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Cordova/Ionic Native plugins** | v3 is a web-first SSR application. Cordova plugins require a native wrapper (Capacitor/Cordova), which conflicts with SSR and adds build complexity.     | Web APIs: `getUserMedia()` for camera, `navigator.geolocation` for location, Web Push for notifications. All supported in modern browsers.                   |
| **Sanity CMS**                   | Adds external dependency, requires Sanity account, increases query latency (API calls to Sanity cloud), and splits data across two stores (Sanity + DB). | PostgreSQL `event_content` table with markdown body. Admin CRUD for editing. Same data store as everything else.                                             |
| **Auth0**                        | Vendor lock-in, cost at scale (Auth0 charges per MAU), and the starter already has a complete Paseto-based auth implementation with RBAC.                | Starter's auth module: Paseto tokens, bcrypt/argon2 passwords, refresh token rotation, role-based permissions. Zero external dependency.                     |
| **Moment.js**                    | 330KB+ bundle, mutable API, deprecated in favor of Temporal/dayjs. Already replaced by dayjs in v2.                                                      | dayjs (2KB) or native `Intl.DateTimeFormat` + `Temporal` (Stage 3, polyfill available). Decision: dayjs for now, migrate to Temporal when it ships natively. |

---

## 2. Frontend Component Architecture Analysis

### 2.1 Decision: Ionic to Tailwind CSS Component Migration

**The core architectural shift:** Moving from Ionic's pre-built component library (`ion-card`, `ion-list`, `ion-button`, `ion-tabs`, etc.) to custom Tailwind CSS components.

**What this means:**

| Aspect                        | Ionic (v1/v2)                                                           | Tailwind (v3)                                                       | Tradeoff                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Component count**           | ~30 Ionic components used out of the box                                | ~16 starter components + ~22 new to build                           | **More initial work**, but complete control over design and behavior. No Ionic version upgrade treadmill.      |
| **Mobile UX**                 | Ionic provides native-like gestures, transitions, and haptics           | Must implement responsive design manually with Tailwind breakpoints | Ionic's mobile UX is superior for native-app-feel. Tailwind gives better SSR compatibility and design freedom. |
| **Bundle size**               | `@ionic/angular` adds ~200-300KB gzipped                                | Tailwind CSS purges unused styles to ~10-30KB                       | Significant performance win for v3.                                                                            |
| **SSR compatibility**         | Ionic has limited SSR support (many components use `window`/`document`) | Tailwind is pure CSS, fully SSR-compatible                          | **Critical advantage** for v3's SSR goal.                                                                      |
| **Accessibility**             | Ionic provides ARIA attributes on its components                        | Must implement accessibility manually (use `@angular/cdk` as base)  | More work, but also more control. The starter enforces ARIA via ESLint.                                        |
| **Design system consistency** | Ionic has its own design language (Material/iOS)                        | Custom design system with Tailwind tokens                           | Freedom to create a unique conference brand, not constrained to Ionic's look.                                  |

**Decision rationale:** The SSR requirement alone makes Ionic impractical. Ionic components rely heavily on browser APIs and Shadow DOM, which break server-side rendering. Tailwind CSS is pure CSS utility classes — fully compatible with Angular SSR.

**Risk mitigation:** The starter already has 16 components. The `@angular/cdk` package provides accessible primitives (overlay, focus trap, keyboard navigation) without UI opinions. Use CDK for complex components (dialogs, dropdowns, tooltips) and Tailwind for styling.

### 2.2 Component Reuse from Starter

The starter provides these components. Analysis of how each maps to Conferentia needs:

| Starter Component                      | Direct Reuse? | Adaptation Needed                                                  |
| -------------------------------------- | ------------- | ------------------------------------------------------------------ |
| `badge`                                | Yes           | Extend with activity-type color mapping and abstract status colors |
| `button`                               | Yes           | As-is; already supports variants                                   |
| `card`                                 | Yes           | Base for activity-card, speaker-card, sponsor-card                 |
| `data-table`                           | Yes           | Admin pages for abstracts, attendance, users                       |
| `confirm-dialog`                       | Yes           | Abstract submission confirmation, attendance actions               |
| `pagination`                           | Yes           | All list pages                                                     |
| `sidebar` + `nav-item` + `nav-section` | Yes           | Dashboard and admin navigation                                     |
| `header`                               | Extend        | Add event branding (logo, name), responsive navigation             |
| `drawer`                               | Yes           | Mobile navigation, filter panels                                   |
| `loading-spinner` / `spinner`          | Yes           | All async operations                                               |
| `breadcrumb`                           | Yes           | Admin deep navigation                                              |
| `theme-toggle`                         | Yes           | As-is                                                              |

### 2.3 New Components — Complexity Assessment

| Component                   | Complexity | Why                                                                                                                 | Key Technical Decisions                                                                                                                                                                                                                                                                                                                     |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app-activity-card`         | Medium     | Must display: type badge (colored), title, time range, location, speaker count, favorite toggle. Responsive layout. | Use starter's `card` as base. Compose with `badge` for type. Signal inputs for reactive data.                                                                                                                                                                                                                                               |
| `app-qr-scanner`            | High       | Camera access via Web API, real-time video frame analysis, QR decoding, error handling (permissions, no camera).    | Use `navigator.mediaDevices.getUserMedia()` + `jsQR` library. Must handle: permission denied, no camera, low light, multiple cameras. Create as a standalone component with `(scanned)` output event. SSR: guard with `@if (isBrowser)` since camera API is browser-only.                                                                   |
| `app-qr-code`               | Low        | Generate QR code image from string data.                                                                            | Use `qrcode` npm package (lightweight, no canvas dependency needed — can generate SVG).                                                                                                                                                                                                                                                     |
| `app-map-view`              | High       | Interactive map with markers, clustering, popups, geolocation button.                                               | Leaflet + `@asymmetrik/ngx-leaflet` or raw Leaflet with Angular signals. SSR: must be wrapped in `@defer` or `@if (isBrowser)` because Leaflet requires `window`. **Alternative considered:** MapLibre GL JS (vector tiles, better performance at scale). **Decision:** Leaflet — simpler, sufficient for conference-scale (10-50 markers). |
| `app-abstract-form`         | High       | Multi-step form: metadata, authors (dynamic list), file upload, review and submit. Validation, draft saving.        | Angular Reactive Forms with Zod validation. Multi-step via `stepper` pattern (consider `@angular/cdk` stepper). File upload as separate component.                                                                                                                                                                                          |
| `app-file-upload`           | Medium     | Drag-and-drop, progress indicator, file type/size validation, retry.                                                | `<input type="file">` with drag events. Use `HttpClient` with `reportProgress: true` for upload progress. Validate MIME type + file size client-side before upload.                                                                                                                                                                         |
| `app-schedule-day-selector` | Low        | Horizontal scrollable list of date pills/tabs.                                                                      | Simple component with `(daySelected)` output. Use Tailwind `flex overflow-x-auto` for horizontal scroll.                                                                                                                                                                                                                                    |
| `app-countdown-timer`       | Low        | Countdown to a target datetime.                                                                                     | `computed()` signal recalculated via `setInterval(1000)`. Display days/hours/minutes/seconds. Clean up interval in `DestroyRef`.                                                                                                                                                                                                            |
| `app-standings-table`       | Low-Medium | Sorted table with rank, team name, points. Real-time updates desirable.                                             | Use starter's `data-table` with custom columns. For real-time: polling every 30s or SSE (Server-Sent Events) for live updates during competition.                                                                                                                                                                                           |
| `app-search-input`          | Low        | Text input with debounce, clear button, search icon.                                                                | `model()` signal with `debounceTime` effect. Emit `(searchChanged)` after 300ms debounce.                                                                                                                                                                                                                                                   |

---

## 3. Route Architecture Analysis

### 3.1 Decision: Three Route Groups

**Current starter:** Two route groups — `auth` (unauthenticated) and `dashboard` (authenticated).

**v3 adds:** A `public` route group for event content visible without authentication.

**Why three groups instead of two:**

| Approach                                                          | Pros                                                                                                                                                        | Cons                                                                                                                       |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Two groups** (auth + dashboard, all event content behind login) | Simpler routing; forces registration for analytics                                                                                                          | Terrible UX — attendees can't browse schedule without creating an account; kills SEO for event pages; blocks sharing links |
| **Three groups** (auth + public + dashboard) — **chosen**         | Event content is publicly accessible (good for SEO, link sharing, casual browsing); authenticated features (favorites, abstracts, attendance) require login | More route configuration; must handle "login to save favorite" UX pattern                                                  |
| **Four groups** (auth + public + dashboard + admin)               | Clean separation of admin concerns                                                                                                                          | Over-segmented; admin is just a dashboard subset with role guard                                                           |

**Decision: Three groups (public, auth, dashboard).** Admin pages live under `dashboard` with an `adminGuard`, not as a separate route group. This matches the starter's existing pattern (dashboard has child routes) and avoids a fourth layout component.

**Route structure:**

```
/events/...                        -> Public (no auth)
/auth/...                          -> Auth flows (no auth)
/dashboard/...                     -> Authenticated user features
/dashboard/admin/...               -> Admin features (auth + admin role)
```

### 3.2 Event-Scoped Routing

**The challenge:** Most routes are scoped to an event (`/events/:eventId/schedule`). How does the event context propagate?

| Approach                                                                                          | Pros                                             | Cons                                                                        |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| **Route parameter + guard** — `eventContextGuard` reads `:eventId`, loads event into `EventStore` | Clean URL, SSR-friendly, bookmarkable, shareable | Must validate eventId on every route change; error handling for invalid IDs |
| **Query parameter** (`?eventId=123`)                                                              | Easy to add/remove                               | Ugly URLs, not RESTful, bad for SEO                                         |
| **Subdomain** (`event-name.conferentia.com`)                                                      | Clean URLs, native multi-tenancy                 | Complex DNS setup, SSL per subdomain, harder to implement                   |
| **Session/cookie-based**                                                                          | Persistent across navigation                     | Not shareable, not bookmarkable, breaks SSR                                 |

**Decision: Route parameter + `eventContextGuard`.** The guard resolves the event from the API, stores it in `EventStore`, and redirects to a 404 page if the event doesn't exist. All child routes read from `EventStore` rather than re-fetching.

### 3.3 SSR Strategy for Public Pages

**The rationale:** Public event pages (schedule, speakers, sponsors, about) benefit enormously from SSR:

- **SEO:** Search engines can index conference content
- **Social sharing:** OpenGraph meta tags render correctly when shared on social media
- **Performance:** First Contentful Paint is faster on slow mobile connections at conference venues

**What to SSR vs. CSR:**

| Route Group          | Rendering | Why                                                     |
| -------------------- | --------- | ------------------------------------------------------- |
| `/events/*` (public) | **SSR**   | SEO, social sharing, performance                        |
| `/auth/*`            | **CSR**   | No SEO value, form-heavy, interactive                   |
| `/dashboard/*`       | **CSR**   | Authenticated content, highly interactive, no SEO value |

**Technical approach:** Angular 21's built-in SSR via `@angular/ssr`. Configure route-level rendering strategy:

- Public routes: `ServerRoute` with `RenderMode.Server`
- Auth/dashboard routes: `RenderMode.Client`

**Tradeoff:** SSR adds server load. For a conference app with typically < 10,000 users, this is negligible. Cache SSR output with a 5-minute TTL for public pages (event data changes infrequently).

---

## 4. State Management Analysis

### 4.1 Decision: NgRx Signal Stores vs. Alternatives

**v1 approach:** Services with static properties (`UsuarioService.usuarioLogeado` — a static field), `@ionic/storage` for persistence.
**v2 approach:** Services with `BehaviorSubject` observables (`currentUser$`, `currentEvent$`).
**v3 options:**

| Approach                               | Pros                                                                                                                                       | Cons                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **NgRx Signal Stores** — chosen        | Already in starter; signal-based (matches Angular 21 direction); built-in computed state; devtools support; entity adapter for collections | Learning curve for NgRx concepts; boilerplate for simple state                                                     |
| **Plain Angular signals + services**   | Simplest; no library dependency; easy to understand                                                                                        | No devtools; manual computed state; no entity management patterns; scales poorly for complex state                 |
| **RxJS BehaviorSubjects** (v2 pattern) | Familiar from v2; powerful operators                                                                                                       | Angular is moving away from RxJS for state; signals are the future; mixing signals and observables adds complexity |
| **NGXS**                               | Less boilerplate than NgRx; decorator-based                                                                                                | Smaller community; not signal-native; would conflict with starter's NgRx setup                                     |

**Decision: NgRx Signal Stores.** The starter already uses this pattern (`src/app/store/auth/auth.store.ts`). Consistency is more valuable than individual preferences. NgRx Signal Stores combine the simplicity of signals with the structure of NgRx.

### 4.2 Store Granularity

**Question:** How many stores, and how granular?

| Approach                                                                                                                                                            | Pros                                                               | Cons                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **One store per bounded context** (event, activity, participant, abstract, attendance, competition, venue, sponsor, committee, favorite, subject-area) — **chosen** | Clear boundaries; each store is testable in isolation; follows DDD | 11 stores might feel like many; some stores are very simple (committee: just a list)   |
| **Fewer, larger stores** (e.g., "event" store contains activities, participants, sponsors)                                                                          | Fewer files; co-located related data                               | Violates SRP; hard to test; changes to one entity affect the entire store              |
| **Feature-based stores** (one store per page/feature)                                                                                                               | Maps to UI; easy to reason about                                   | Data duplication across stores; shared entities (like "event") don't have a clear home |

**Decision: One store per bounded context.** Even simple stores (3-4 properties) benefit from the pattern's predictability. A `CommitteeStore` with just `members` and `loading` is still worth having — it's testable, it's consistent, and it doesn't pollute a larger store.

### 4.3 Data Flow Pattern

```
Component -> Store (action/method) -> API Service (HTTP) -> Backend API
                                                              |
Component <- Store (signal update) <- API Service (response) <-
```

**Key decision:** API services are thin HTTP clients. Business logic lives in stores (frontend) or services (backend). API services do NOT transform data — that's the mapper's job.

**Data transformation chain:**

```
API Response (JSON) -> Zod contract validation -> Domain mapper -> Domain model -> Store state -> Component signal
```

---

## 5. Backend Architecture Analysis

### 5.1 Decision: Hono + Drizzle vs. Alternatives

**v1:** PHP scripts with direct MySQL queries. No framework.
**v2:** NestJS 9 with Sanity CMS connector.
**v3:** Must use the starter's stack (Hono + Drizzle + PostgreSQL) — this is a given constraint.

**Analysis of the starter's backend vs. v2's NestJS:**

| Aspect          | NestJS (v2)                  | Hono + Drizzle (starter)      | Impact                                                                                        |
| --------------- | ---------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| **DI**          | NestJS built-in (decorators) | Awilix (PROXY mode)           | Different pattern but equivalent capability. Awilix is more explicit — no "magic" decorators. |
| **ORM**         | None (Sanity client)         | Drizzle (type-safe SQL)       | Major upgrade. Drizzle generates types from schema, catches errors at compile time.           |
| **Validation**  | Class-validator decorators   | Zod schemas                   | Zod is more composable, shares schemas between frontend/backend via `src/contracts/`.         |
| **Performance** | Express-based (~15K req/s)   | Hono (~100K+ req/s)           | Hono is significantly faster. Matters less for a conference app, but headroom is nice.        |
| **Testing**     | Jest + supertest             | Vitest + direct service calls | Starter pattern tests services and controllers independently via mock containers.             |

### 5.2 Decision: PostgreSQL vs. Sanity CMS vs. Hybrid

**v2's Sanity approach:** All data in Sanity CMS (headless). Backend services query Sanity via GROQ.

| Approach                                                               | Pros                                                                                                                     | Cons                                                                                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **Full PostgreSQL** — chosen                                           | Single data store; full SQL power; transactions; referential integrity; no vendor dependency; self-hosted; works offline | No visual content editor (must build admin UI); schema migrations needed                                                     |
| **Sanity CMS** (v2 approach)                                           | Visual content editor; real-time collaboration; CDN-backed; content versioning                                           | Vendor lock-in; cost at scale; latency (API calls); no referential integrity; splits data across stores; GROQ learning curve |
| **Hybrid** (PostgreSQL for structured data + headless CMS for content) | Best of both; structured data with integrity, content with visual editing                                                | Two data sources to maintain; increased deployment complexity; data synchronization issues                                   |

**Decision: Full PostgreSQL.** The `event_content` table with a markdown body column provides CMS-like content management. The admin dashboard provides editing UI. For a conference app, content pages (about, travel, contact) change rarely — a simple markdown editor in the admin is sufficient.

**If richer content editing is needed later:** Add a WYSIWYG markdown editor (e.g., TipTap or Milkdown) to the admin page. This is a UI enhancement, not an architecture change.

### 5.3 File Upload Strategy

**v2's approach:** Multer saves to `./files` directory, then uploads to Sanity assets API.

**v3 options:**

| Approach                                                                 | Pros                                                                                 | Cons                                                      |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| **S3-compatible object storage** (AWS S3, MinIO, Cloudflare R2) — chosen | Scalable; CDN-friendly; pre-signed URLs for direct upload; no server disk dependency | External service dependency; pre-signed URL complexity    |
| **Local filesystem**                                                     | Simple; no external dependency                                                       | Doesn't scale; lost on container restart; no CDN          |
| **PostgreSQL large objects**                                             | Single data store                                                                    | Bad for large files; bloats DB; hard to serve efficiently |
| **Base64 in DB**                                                         | Simple                                                                               | Terrible performance; 33% size increase; bloats DB        |

**Decision: S3-compatible object storage.** Use MinIO for development/self-hosted, AWS S3 or Cloudflare R2 for production. Implement pre-signed upload URLs so the client uploads directly to storage (bypasses server bandwidth limits).

**Upload flow:**

1. Client requests pre-signed URL from `POST /api/file/upload-url` (Zod-validated: filename, content-type, size)
2. Backend generates pre-signed PUT URL (expires in 15 minutes)
3. Client uploads directly to object storage
4. Client sends the object key to the abstract submission endpoint
5. Backend validates the object exists before accepting the abstract

### 5.4 Database Schema Design Decisions

#### Event Feature Toggles

**Question:** How to handle features that are optional per event (competitions, attendance, abstracts)?

| Approach                                                                                 | Pros                                                        | Cons                                                              |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| **JSON column** (`features_enabled: { attendance: true, competitions: false }`) — chosen | Flexible; no schema changes for new features; easy to query | No referential integrity on feature names; must validate with Zod |
| **Boolean columns** (`has_attendance`, `has_competitions`)                               | Type-safe; schema-enforced                                  | Schema migration for every new feature; many nullable columns     |
| **Separate `event_feature` junction table**                                              | Normalized; extensible                                      | Over-engineered for ~5-10 features                                |

**Decision: JSON column with Zod validation.** Drizzle supports `jsonb` columns with type inference. Zod schema validates the feature flags shape at runtime.

#### Abstract Status State Machine

**v2's approach:** Simple string status (`draft`, `submitted`, etc.) with no enforced transitions.

**v3 improvement:** Define valid transitions explicitly.

```
draft -> submitted
submitted -> under_review
under_review -> revision_requested | accepted | rejected
revision_requested -> submitted (re-submission)
```

**Implementation:** The `AbstractService` enforces transitions — the status column is just a string, but the service rejects invalid transitions (e.g., `draft` to `accepted`). No need for a state machine library; a simple `Map<CurrentStatus, AllowedNextStatuses[]>` suffices.

#### Attendance Uniqueness

**Question:** Can a user have multiple entry/exit records for the same activity?

**v1 behavior:** Yes — records entry timestamp and exit timestamp as separate rows with `concept` = "Entrada"/"Salida".

**v3 decision:** Keep the same approach. A user can check in, leave, and return. Each entry/exit is a distinct row with `direction` and `recorded_at`. Unique constraint is on `(user_id, activity_id, direction, recorded_at)` — not on `(user_id, activity_id)`.

### 5.5 Authentication Architecture Analysis

**v1:** Custom JWT with plaintext password storage in localStorage. `GlobalService` holds the token.
**v2:** Auth0 OAuth2 with `@auth0/auth0-angular`. User data synced to Sanity on first login.

**v3 options:**

| Approach                           | Pros                                                                                                                                           | Cons                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Starter's Paseto auth** — chosen | Already built and tested; no vendor dependency; Paseto is more secure than JWT (no algorithm confusion); RBAC included; refresh token rotation | Must implement registration flow (starter has login but not full registration)   |
| **Auth0** (v2 approach)            | Mature; social login; MFA; user management dashboard                                                                                           | Cost ($23/mo for 1K MAU); vendor lock-in; latency; Auth0 outages affect your app |
| **Supabase Auth**                  | OSS; social login; can self-host                                                                                                               | Another dependency; must integrate with existing Drizzle schema                  |
| **Keycloak**                       | Enterprise-grade; self-hosted; full featured                                                                                                   | Heavy (Java); complex setup; overkill for conference app                         |

**Decision: Starter's Paseto auth.** It's already implemented, tested, and follows the project's conventions. Extend with:

- Registration endpoint (email + password + profile data)
- Email verification flow (using starter's `EmailService`)
- Password reset flow (starter already has the page)
- Optional social login later (add OAuth2 providers to the auth module)

### 5.6 API Naming Convention Compliance

Following CLAUDE.md's strict naming rules:

| Layer          | Convention                                       | Example                                                     |
| -------------- | ------------------------------------------------ | ----------------------------------------------------------- |
| **Repository** | `find*()` for reads                              | `findById(id)`, `findByEventId(eventId)`, `findAll(params)` |
| **Repository** | `create()`, `update()`, `delete()` for writes    | `create(params)`, `update(id, params)`                      |
| **Service**    | `get*()` / `getAll*()` for reads                 | `getActivity(id)`, `getAllActivities(params)`               |
| **Service**    | `create*()`, `update*()`, `delete*()` for writes | `createActivity(params)`                                    |
| **Controller** | HTTP verbs map to service methods                | `GET /activity/:id` maps to `getActivity()`                 |

---

## 6. Domain Model Architecture Analysis

### 6.1 Pattern: IInterface + Model + Mapper

The starter enforces this pattern (seen in `role.interface.ts`, `role.model.ts`, `role.mapper.ts`):

```
IInterface (contract)  ->  Model (immutable class)  ->  Mapper (API <-> Domain)
```

**Why this pattern (vs. alternatives):**

| Approach                                     | Pros                                                                                                                           | Cons                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **IInterface + Model + Mapper** — chosen     | Immutability enforced; behavior on model (`hasPermission()`); clean separation of API shape vs. domain shape; testable mappers | More files per entity (4 files: interface, model, mapper, spec)              |
| **Plain interfaces only** (v2 approach)      | Simple; fewer files                                                                                                            | No behavior on model; no immutability guarantee; easy to accidentally mutate |
| **Zod schemas as types**                     | Runtime validation + types in one place                                                                                        | No behavior; runtime overhead on every construction; not class-based         |
| **Class with decorators** (NestJS DTO style) | Familiar to NestJS developers                                                                                                  | Decorator overhead; not tree-shakeable; doesn't match starter conventions    |

**Decision: Follow the starter's pattern exactly.** Every bounded context gets 4 files:

- `*.interface.ts` — The contract (`IEvent`, `IActivity`)
- `*.model.ts` — Immutable class implementing the interface, with domain methods
- `*.mapper.ts` — Transforms API response to domain model
- `*.model.spec.ts` — Tests for model behavior

### 6.2 Bounded Context Analysis

**Question:** How do we slice the domain? Which entities belong together?

| Context         | Entities                                 | Rationale                                                                                                                                                              |
| --------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Event**       | Event, EventContent                      | The aggregate root. All other entities are scoped to an event.                                                                                                         |
| **Activity**    | Activity, ActivityType, SubjectArea      | Activities are the core schedule unit. Types and areas are classification taxonomies. Grouped because they're always queried together (schedule page needs all three). |
| **Participant** | Participant                              | Speakers and panelists. Separate from committee because the UX and data are different (speakers have bios, curriculum; committee members have organizational roles).   |
| **Committee**   | CommitteeMember                          | Organizational committee. Different lifecycle from participants.                                                                                                       |
| **Sponsor**     | Sponsor                                  | Independent lifecycle; tier-based display.                                                                                                                             |
| **Abstract**    | Abstract, AbstractAuthor, AbstractReview | Complex workflow with its own state machine. Authors are value objects within the abstract aggregate.                                                                  |
| **Attendance**  | Attendance                               | Event-level tracking. Tied to activities and users but has its own query patterns (reports, summaries).                                                                |
| **Competition** | Competition, Team, TeamMember, TeamScore | Gamification domain. Self-contained lifecycle.                                                                                                                         |
| **Venue**       | Venue                                    | Geospatial data with its own rendering (maps).                                                                                                                         |

**Alternative considered:** Merging Participant + Committee into a "People" context. **Rejected** because their data shapes, query patterns, and admin workflows are different. Separate contexts avoid a "God entity" that tries to model both speakers and organizers.

### 6.3 Model Behavior Examples

Following the starter's `Role` model (which has `hasPermission()` and `hasPermissionByIdentifier()`), domain models should encapsulate behavior:

| Model        | Behavior Methods                                                                | Why                                                                                |
| ------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `Activity`   | `isOngoing()`, `hasEnded()`, `isUpcoming()`, `getDuration()`, `overlaps(other)` | Schedule logic: "is this session happening now?", "does it conflict with another?" |
| `Abstract`   | `canTransitionTo(status)`, `isEditable()`, `isReviewable()`                     | State machine enforcement at the domain level.                                     |
| `Event`      | `isActive()`, `hasFeature(feature)`, `isRegistrationOpen()`                     | Event lifecycle checks.                                                            |
| `Attendance` | `isEntry()`, `isExit()`                                                         | Simple discriminators.                                                             |

---

## 7. Phased Roadmap — Detailed Analysis

### Phase 1 — Core Infrastructure

**Goal:** Event CRUD, public layout, routing structure.

**Why first:** Every other feature depends on events existing. The routing structure must be established before pages can be built. This phase validates that the starter can be extended without conflicts.

**Risk:** Route architecture changes touch `app.routes.ts`, which is a high-traffic file. Conflicts likely if other work happens in parallel.
**Mitigation:** Complete Phase 1 before branching for other phases.

**Deliverables:** Event API (CRUD), EventStore, public layout, event-list page, event-landing page.

### Phase 2 — Schedule & Activities

**Goal:** The most-used feature. Attendees spend 80%+ of their time on the schedule.

**Why second:** Schedule is the #1 user flow. If only two phases ship, events + schedule make a usable MVP.

**Technical challenge:** Schedule grouping by day requires timezone-aware date handling. v1 used Moment.js locale formatting; v2 used dayjs with timezone plugin.
**Decision:** dayjs with timezone plugin (`dayjs/plugin/timezone`, `dayjs/plugin/utc`). The event's `timezone` column determines display. All dates stored as UTC in the database.

**Deliverables:** Activity API (CRUD), schedule page with day filtering/search, activity detail, countdown timer, favorites.

### Phase 3 — People & Content

**Goal:** Speakers, committee, sponsors, static content pages.

**Why third:** These are "read-mostly" pages with simple data. Low risk, high impact — they round out the public-facing experience.

**Deliverables:** Participant/Committee/Sponsor APIs, corresponding pages, event_content for about/travel/contact.

### Phase 4 — User Features

**Goal:** Registration, profile, preferences.

**Why fourth:** Must exist before abstract submission (Phase 5) and attendance (Phase 6). Can run in parallel with Phase 3 since they're independent.

**Technical challenge:** Registration flow extends the starter's auth module. Must add: registration endpoint, email verification, profile completion check.
**Risk:** Modifying the auth module could introduce security issues.
**Mitigation:** Security audit (via `security-auditor` agent) after this phase.

**Deliverables:** Registration page, profile page, `registrationCompleteGuard`, favorite sync.

### Phase 5 — Abstract Workflow

**Goal:** The most complex academic feature.

**Why fifth:** Depends on users (Phase 4) and events (Phase 1). This is the most complex phase — it involves file upload, state machine, multi-author forms, and reviewer workflow.

**Risk:** Abstract submission is form-heavy and error-prone. Multi-author dynamic forms are notoriously difficult.
**Mitigation:** Build the form as a multi-step wizard. Each step validates independently. Draft saving (auto-save to backend every 30 seconds) prevents data loss.

**Deliverables:** Abstract API with state machine, file upload, submission form, review form, admin review queue.

### Phase 6 — Attendance & Competitions

**Goal:** v1's differentiating features.

**Why sixth:** These are "nice to have" features that depend on activities (Phase 2) and users (Phase 4). Can be skipped for an MVP launch if time is tight.

**Technical challenge (QR scanner):** Web-based QR scanning is the highest-risk technical component. Camera permission UX varies across browsers. Low-light scanning is unreliable.
**Mitigation:** Test on real devices early. Provide fallback manual entry (type attendee ID). Test in conference-like lighting conditions.

**Deliverables:** QR scanner/generator, attendance recording, competition CRUD, standings page.

### Phase 7 — Venue & Notifications

**Goal:** Maps and push notifications.

**Why seventh:** Maps and notifications are supplementary. The app is fully functional without them.

**Technical challenge (Leaflet + SSR):** Leaflet requires `window` and `document`. Must be excluded from SSR.
**Mitigation:** Wrap in `@defer` block or `@if (isBrowser)` check. Lazy-load the Leaflet library.

**Technical challenge (Web Push):** Requires a service worker, VAPID keys, and browser permission. Safari has limited Web Push support.
**Mitigation:** Progressive enhancement — push notifications are offered but not required. Fallback: in-app notification banner.

**Deliverables:** Venue pages with Leaflet maps, Web Push notification service, notification preferences.

### Phase 8 — Admin & Polish

**Goal:** Full admin CRUD, SSR optimization, accessibility, i18n.

**Why last:** Admin features are internal-facing. Polish can only happen after all features exist.

**Deliverables:** All admin CRUD pages, SSR configuration, SEO meta tags, accessibility audit, full i18n coverage.

---

## 8. Risk Assessment Summary

| Risk                                                               | Severity | Likelihood | Mitigation                                                                                            |
| ------------------------------------------------------------------ | -------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| QR scanning unreliable on web                                      | High     | Medium     | Test early on real devices; provide manual fallback; consider library alternatives (zxing-js vs jsQR) |
| Leaflet breaking SSR                                               | Medium   | High       | `@defer` / `@if (isBrowser)` wrapping; lazy loading                                                   |
| Abstract form complexity (multi-author, file upload, draft saving) | High     | Medium     | Multi-step wizard; independent step validation; auto-save                                             |
| Auth module modification introduces vulnerabilities                | High     | Low        | Security audit after Phase 4; follow starter patterns exactly                                         |
| 16+ new DB tables increase migration complexity                    | Medium   | Medium     | One migration per phase; test rollback; use Drizzle's push/migration tooling                          |
| Scope creep (22 new components, 11 stores, 14 API modules)         | High     | High       | Strict phase boundaries; MVP mindset (Phases 1-4 are the core); defer nice-to-haves                   |

---

## 9. Verification Strategy

| Layer                | Tool                               | Approach                                                                    |
| -------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| Domain models        | Vitest + `fn()` from `@test-utils` | Test immutability, behavior methods, edge cases                             |
| Mappers              | Vitest                             | Test API response to domain model transformation                            |
| Backend services     | Vitest + mock containers           | Test business logic with mocked repositories                                |
| Backend repositories | Vitest + test database             | Integration tests against PostgreSQL (or in-memory)                         |
| Backend controllers  | Vitest + supertest-like            | HTTP-level tests for request/response shape                                 |
| Frontend stores      | Vitest + mock API services         | Test state transitions, computed values                                     |
| Frontend components  | Angular Testing Library            | User-centric tests: render, interact, assert                                |
| E2E                  | Playwright                         | Critical flows: registration, abstract submission, review                   |
| CI                   | `npm run ci`                       | Must pass after every phase (stylelint, lint, test, build, storybook:build) |
| Code review          | `code-reviewer` agent              | After every phase                                                           |
| Security             | `security-auditor` agent           | After Phase 4 (auth) and Phase 5 (file upload)                              |
