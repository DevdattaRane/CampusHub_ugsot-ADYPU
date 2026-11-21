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
