# UI Migration Status

## Goal

Bring every route and shared component into the visual system defined by `ugsot-campus-hub.html`, preserve behavior, and make `/welcome` feel complete rather than sparse.

## Design rules (short)

- Use only the existing Canvas, Ink, Electric Blue, Coral, Mint, Stone, and Muted CSS variables; light mode remains the default.
- Prefer 1px hairlines, 10–14px box radii, no hard offset shadows, sentence case, and the shared page container.
- Use pill actions, muted Stone chips, ruled rows, flat tiles, and readable forms; remove emoji icons and legacy high-contrast treatments.
- Preserve routes, data flow, hooks, handlers, and all behavior. Honor reduced motion.

## Done

Existing work on the current branch; these are foundations or partial page treatments, not evidence that the full site migration is complete:

- `app/globals.css` — shared tokens, 1100px app container, shared primitives, and existing effect styles.
- `app/welcome/page.tsx`, `components/landing/WelcomeExperience.tsx` — existing landing content and layout; event/project listings remain neutral where verified data is unavailable.
- `components/landing/welcome.module.css` — widened the landing shell to 1280px, balanced the 12-column hero, increased type and row scale, and tightened section spacing.
- `app/auth/layout.tsx`, `components/auth/` — new auth visual shell and existing forms; audit form controls and consistency.
- `components/NavBar.tsx`, `components/SiteShell.tsx`, `components/SiteRail.tsx`, `components/SiteFooter.tsx` — shared navigation/shell foundations.
- `components/IndexMenu.tsx` — opaque full-screen Index overlay with 28–44px links.
- `components/effects/` — lazy effect components and fallbacks already exist.
- `components/GlobalMotion.tsx`, `components/GlobalSearchModal.tsx`, `components/ui/Toast.tsx` — existing motion/search/toast foundations.
- `app/loading.tsx` — shared ruled-row loading skeleton.
- `components/AttendanceTracker.tsx`, `components/DockersModal.tsx`, `components/LeaderboardView.tsx`, `components/MentorshipView.tsx`, `components/ModerationView.tsx`, `components/NotificationsView.tsx`, `components/OpportunitiesView.tsx`, `components/ProfileView.tsx`, `components/ProjectList.tsx` — partial earlier styling/empty-state work; page-level migration remains.

## In progress

- Landing visual fix is committed. Responsive checks pass; production build remains blocked by TypeScript errors in the pre-existing `refrence-repos/` tree. Pausing before the Opportunities group per the build-failure rule.

## Remaining checklist

### Routes (`app/**/page.tsx`)

- [ ] `/` — `app/page.tsx` (dashboard)
- [x] `/welcome` — `app/welcome/page.tsx`, `components/landing/WelcomeExperience.tsx`, `components/landing/welcome.module.css` (wider layout, larger type, denser section rhythm; neutral empty-state copy retained)
- [ ] `/events` — `app/events/page.tsx`
- [ ] `/events/[eventId]` — `app/events/[eventId]/page.tsx`
- [ ] `/events/[eventId]/attendance` — `app/events/[eventId]/attendance/page.tsx`
- [ ] `/projects` — `app/projects/page.tsx`
- [ ] `/projects/[id]` — `app/projects/[id]/page.tsx`
- [ ] `/students` — `app/students/page.tsx`
- [ ] `/students/[id]` — `app/students/[id]/page.tsx`
- [ ] `/community` — `app/community/page.tsx`
- [ ] `/opportunities` — `app/opportunities/page.tsx`
- [ ] `/leaderboard` — `app/leaderboard/page.tsx`
- [ ] `/profile` — `app/profile/page.tsx`
- [ ] `/notifications` — `app/notifications/page.tsx`
- [ ] `/moderation` — `app/moderation/page.tsx`
- [ ] `/certificates/[id]` — `app/certificates/[id]/page.tsx`
- [ ] `/verify` — `app/verify/page.tsx`
- [ ] `/mentorship` — `app/mentorship/page.tsx`
- [ ] `/intro` — `app/intro/page.tsx`
- [ ] `/onboarding` — `app/onboarding/page.tsx`
- [x] `/auth/sign-in` — `app/auth/sign-in/page.tsx` (auth redesign already applied; verify form controls during shared pass)
- [x] `/auth/register` — `app/auth/register/page.tsx` (auth redesign already applied; verify form controls during shared pass)
- [x] `/auth/forgot-password` — `app/auth/forgot-password/page.tsx` (auth redesign already applied; verify form controls during shared pass)
- [x] `/auth/reset-password` — `app/auth/reset-password/page.tsx` (auth redesign already applied; verify form controls during shared pass)
- [x] `/dev/effects` — `app/dev/effects/page.tsx` (effects preview only)

### Shared components

- [ ] `components/AttendanceTracker.tsx` (partial styling; migrate list rows and controls)
- [ ] `components/Avatar.tsx`
- [ ] `components/BottomNav.tsx`
- [ ] `components/Calendar.tsx`
- [ ] `components/CertificateVerifier.tsx`
- [ ] `components/CommunityFeed.tsx`
- [ ] `components/CommunityView.tsx`
- [ ] `components/DashboardTab.tsx`
- [ ] `components/DockersModal.tsx` (partial empty-state styling; audit modal)
- [ ] `components/EventDateBlock.tsx`
- [ ] `components/EventRegistrationControl.tsx`
- [ ] `components/EventsBrowser.tsx`
- [ ] `components/FeatureSuggestions.tsx`
- [ ] `components/FilterPills.tsx`
- [ ] `components/ForkButton.tsx`
- [x] `components/GlobalMotion.tsx` (existing shared motion foundation)
- [ ] `components/GlobalSearchModal.tsx` (existing search styling; audit against shared controls)
- [ ] `components/HackathonAnnouncements.tsx`
- [ ] `components/HackathonTeamRegistration.tsx`
- [ ] `components/Header.tsx`
- [ ] `components/HomeCalendar.tsx`
- [x] `components/IndexMenu.tsx` (opaque full-screen overlay; 28–44px links)
- [ ] `components/LeaderboardView.tsx` (partial empty-state styling; migrate full view)
- [ ] `components/MentorshipView.tsx` (partial empty-state styling)
- [ ] `components/ModerationView.tsx` (partial empty-state styling)
- [x] `components/NavBar.tsx` (shared design/effect foundation)
- [ ] `components/NotificationsView.tsx` (partial styling; migrate full view)
- [ ] `components/OnboardingView.tsx`
- [ ] `components/OpportunitiesView.tsx` (partial empty-state styling; migrate full view)
- [ ] `components/PageHero.tsx`
- [ ] `components/PrintCertificateButton.tsx`
- [ ] `components/ProfileFab.tsx`
- [ ] `components/ProfileView.tsx` (existing shader placement; migrate remaining UI)
- [ ] `components/ProjectDetailView.tsx`
- [ ] `components/ProjectList.tsx` (partial empty-state styling; migrate full view)
- [x] `components/SiteFooter.tsx` (shared design foundation)
- [x] `components/SiteRail.tsx` (shared design foundation)
- [x] `components/SiteShell.tsx` (shared design foundation)
- [ ] `components/StudentsBrowser.tsx`
- [ ] `components/TeammateCard.tsx`
- [x] `components/ThemeToggle.tsx` (preserve light default and dark toggle)
- [ ] `components/icons.tsx` (audit for emoji and monochrome icon consistency)

### UI primitives

- [x] `components/ui/Box.tsx`
- [x] `components/ui/Button.tsx`
- [x] `components/ui/Card.tsx`
- [x] `components/ui/Input.tsx`
- [ ] `components/ui/LiquidLogo.tsx`
- [x] `components/ui/Modal.tsx`
- [x] `components/ui/Pill.tsx`
- [ ] `components/ui/SvgDefs.tsx`
- [x] `components/ui/Tag.tsx`
- [x] `components/ui/Tile.tsx`
- [ ] `components/ui/Toast.tsx` (existing glass treatment; audit colors, borders, and focus)

### Effects and page-specific components

- [x] `components/effects/EffectsPreview.tsx`
- [x] `components/effects/GlassPanel.tsx`
- [x] `components/effects/LiquidLogo.tsx`
- [x] `components/effects/LiquidMetalLayer.tsx`
- [x] `components/effects/ShaderBackground.tsx`
- [x] `components/effects/ShaderLayer.tsx`
- [ ] `components/auth/AuthForm.tsx`
- [ ] `components/auth/ForgotPasswordForm.tsx`
- [ ] `components/auth/ResetPasswordForm.tsx`
- [ ] `components/auth/SignOutButton.tsx`
- [ ] `components/intro/IntroScreen.tsx`
- [x] `components/landing/WelcomeExperience.tsx` (existing markup now uses the widened, denser visual layout)

## Known issues

- Existing untracked workspace items (`.DS_Store`, `INTEGRATION.md`, `refrence-repos/`, `ugsot-campus-hub.html`) are unrelated and must not be added to migration commits.
- `npm run build` compiles the app, then TypeScript checking fails on existing errors inside `refrence-repos/` (including missing reference-repo dependencies and an incompatible `appIsrStatus` config option).
- `app/welcome/page.tsx` currently supplies an empty upcoming-event list because the sample event data is not verified live data; keep neutral copy unless an existing read-only live-data helper is available.
- Earlier full lint was blocked by an unresolved `@eslint/eslintrc` dependency in `refrence-repos/`; scoped lint excluding that directory passed.
- Legacy hardcoded colors, emoji, thick borders, and shadows still need a systematic audit.

## Commands (dev/build/lint)

- Development: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Scoped lint when the unrelated reference-repo config blocks lint: `npm run lint -- --ignore-pattern 'refrence-repos/**'`

## How another AI should resume

```text
Resume the UI migration in this repository. Read UI_MIGRATION_STATUS.md first. The shared-system group and landing visual fix are committed; next work on Opportunities (`app/opportunities/page.tsx` and `components/OpportunitiesView.tsx`) as one small group after the user authorizes continuing. Preserve all behavior: do not touch API/database/Supabase/auth callbacks/config/data fetching/props/hooks/handlers/actions/routes. Use only existing CSS palette variables and the prototype ugsot-campus-hub.html. Update the status file, run npm run build and npm run lint, and commit only the files for that group plus UI_MIGRATION_STATUS.md. Do not stage unrelated untracked files. The normal build is known to fail in `refrence-repos/`; do not change that tree or configs. Stop if that remains the only failure and report changed files plus validation results.
```
