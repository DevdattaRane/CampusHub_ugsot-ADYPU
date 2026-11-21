# Landing page and Noticeboard progress

## Phase 1 — Static landing baseline

### Done

- Replaced the previous landing content with a responsive welcome page.
- Added the main navigation, clear sign-in and opportunities actions, Pune live clock, and static film-grain overlay.
- Added sections for the Hub statement, Opportunities, Leaderboard, Events, Community, Projects, and the upcoming Noticeboard.
- Kept copy grounded in features already represented by the app; no invented stats, student names, or event listings.
- Kept the page static apart from the live clock. No WebGL or animation dependencies were added.

### Remaining

- Phase 2: Lenis, navigation behavior, scroll-linked statement reveal, and parallax.
- Phase 3: cursor-reactive hero fluid effect and its fallbacks.
- Phase 4: public Noticeboard route and clearly labelled sample data.
- Phase 5: product showcase motion, glass refinements, and event teaser data.
- Phase 6: optional mascot and final accessibility/performance/mobile pass.

### Known issues

- `/noticeboard` is linked from the landing page but is not implemented until Phase 4.
- Supabase currently has no event schedule/location fields or achievements table. The Noticeboard must use clearly labelled sample data unless the user later approves a data/schema change.
- Showcase cards are static descriptions of existing routes, not product screenshots yet.
- `npm run type-check` has existing errors confined to `refrence-repos/`; do not change that tree as part of this work.

### How to test

- Run `npm run dev` and open `/welcome`.
- Check the landing at phone width and a wide desktop viewport.
- Confirm both Sign in links navigate to `/auth/sign-in`, and the feature links point to their existing routes.
- Confirm the clock renders after hydration and updates once per second.

### Phase 1 validation

- Targeted ESLint on the changed TypeScript files passed.
- `/welcome` returned HTTP 200; browser checks at desktop and phone widths found no horizontal overflow or console errors.
- `npm run type-check` still exits with the known `refrence-repos/` errors; it reports no errors outside that tree.

## Phase 2 — Scroll motion

### Done

- Added landing-only Lenis smooth scrolling, synchronized through the GSAP ticker with ScrollTrigger updates and lifecycle cleanup.
- Added fixed navigation theme changes, a pinned word-by-word statement reveal, and restrained parallax for the desktop hero/showcase.
- Kept pinning and parallax off for touch/small layouts and reduced-motion preferences; navigation themes remain available.
- Disabled the shared route-entry animations only on `/welcome` so their transforms do not interfere with the pinned section.
- Skipped `GlobalMotion` only on `/welcome`; other routes keep their existing shared motion.

### Remaining

- Phase 3: cursor-reactive hero fluid effect and its fallbacks.
- Phase 4: public Noticeboard route and clearly labelled sample data.
- Phase 5: product showcase motion, glass refinements, and event teaser data.
- Phase 6: optional mascot and final accessibility/performance/mobile pass.

### Known issues

- `/noticeboard` is still linked but will not exist until Phase 4.
- Supabase has no event schedule/location fields or achievements table; the Noticeboard must use clearly labelled sample data unless the user approves a data/schema change.
- `npm run type-check` reports existing errors confined to `refrence-repos/`; do not change that tree as part of this work.

### Phase 2 validation

- Targeted ESLint on the changed TypeScript files and `git diff --check` passed.
- `npm run type-check` still exits with the known `refrence-repos/` failures and reports no errors outside that tree.
- The production bundle compiled successfully when the known reference-tree type-check failures were temporarily bypassed for browser validation; that temporary config change was removed.
- `/welcome` returned HTTP 200. Desktop browser checks confirmed the pin stays at the viewport top, the statement words reveal while scrolling, navigation themes change by section, and parallax responds. Reduced-motion and mobile checks confirmed pin/parallax are disabled and found no horizontal overflow or page runtime errors.
- Prefetch requests for `/noticeboard` can return 404 until Phase 4; this is expected.

## Phase 3 — Hero fluid effect

### Done

- Added a cursor-reactive fluid shader to the hero visual using the already-installed Paper shader package; no dependency was added.
- Limited the shader to visible, WebGL2-capable desktop layouts with a fine pointer and adequate device capability. Reduced-motion, mobile/touch, unsupported WebGL, low-power, and off-screen cases retain the CSS gradient and orb fallback.
- Lazy-loaded the shader mount so the effect remains client-only.

### Remaining

- Phase 4: public Noticeboard route and clearly labelled sample data.
- Phase 5: product showcase motion, glass refinements, and event teaser data.
- Phase 6: optional mascot and final accessibility/performance/mobile pass.

### Known issues

- `/noticeboard` is still linked but will not exist until Phase 4.
- Supabase has no event schedule/location fields or achievements table; the Noticeboard must use clearly labelled sample data unless the user approves a data/schema change.

### Phase 3 validation

- Targeted ESLint on the changed landing components and `git diff --check` passed.
- `npm run type-check` still exits with the known `refrence-repos/` errors and reports no errors outside that tree.
- `/welcome` returned HTTP 200. Browser validation confirmed the desktop shader renders without console/runtime errors; the canvas is removed on mobile-width and reduced-motion layouts, leaving the CSS fallback in place.

## Phase 4 — Public Noticeboard

### Done

- Added a public `/noticeboard` route with a dedicated full-screen layout, sample event cards, and sample achievement highlights.
- Clearly labelled every item and the page-level notice as illustrative sample content. No student names, live event claims, schema changes, or database/API calls were added.
- Kept the shared app navigation, rail, and footer off this route through a narrowly scoped `SiteShell` exception; other routes are unchanged.

### Remaining

- Phase 5: product showcase motion, glass refinements, and event teaser data.
- Phase 6: optional mascot and final accessibility/performance/mobile pass.

### Known issues

- The Noticeboard is a visual preview only. Supabase has no event schedule/location fields or achievements table, so its cards must remain clearly labelled until a suitable verified data source is approved.

### Phase 4 validation

- Targeted ESLint and `git diff --check` passed.
- `npm run type-check` still exits with the known 369 `refrence-repos/` errors and reports no errors outside that tree.
- `/noticeboard` returned HTTP 200 without authentication. Browser checks confirmed the landing-page link opens it, the shared app navigation/rail/footer are absent, all sample cards are labelled, and desktop/mobile layouts have no horizontal overflow. No browser runtime errors appeared after reload.

## Phase 5 — Showcase and event teaser

### Done

- Added a restrained, staggered GSAP reveal to the product showcase cards. It runs only for desktop fine-pointer layouts with reduced motion disabled; other layouts keep the cards visible and static.
- Refined the showcase preview surfaces with theme-aware translucent glass, blur, a highlight, and a solid-color fallback.
- Reused the Noticeboard’s labelled sample events for two landing-page teasers. The sample status and data limitation are visible beside the entries.

### Remaining

- Phase 6: optional mascot and final accessibility/performance/mobile pass.

### Known issues

- The landing teasers and Noticeboard still use illustrative data; they are not connected to a verified event schedule.

### Phase 5 validation

- Targeted ESLint and `git diff --check` passed.
- `npm run type-check` still exits with the known 369 `refrence-repos/` errors and reports no errors outside that tree.
- `/welcome` returned HTTP 200. Browser checks confirmed showcase cards reveal on scroll on desktop, stay visible with reduced motion and at mobile width, the glass surfaces render, and both event teasers are labelled sample data. No browser runtime errors appeared.

## Phase 6 — Accessibility and final pass

### Done

- Added a keyboard-first skip link that moves focus to the landing page’s main content.
- Kept the optional mascot out because the project has no existing mascot artwork; no new visual asset was needed.
- Completed the landing page’s responsive and reduced-motion review without adding dependencies or changing backend behavior.

### Known issues

- Event teasers and Noticeboard entries remain illustrative sample data because no verified campus schedule or achievements source is available.
- The project-wide type-check still has the existing errors under `refrence-repos/`.

### Phase 6 validation

- Targeted ESLint and `git diff --check` passed.
- `npm run type-check` still exits with the known 369 `refrence-repos/` errors and reports no errors outside that tree.
- `/welcome` returned HTTP 200. Browser checks at 390, 768, 1024, and 1440 viewport settings found no horizontal overflow. Keyboard testing confirmed the skip link is first and moves focus to main. Reduced-motion testing confirmed the shader and pinning are disabled while showcase cards remain visible. No page runtime errors appeared after reload; Next.js still emits its existing development font-preload warnings.
