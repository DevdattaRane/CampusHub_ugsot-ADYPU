# UGSOTADYPU Hub

A campus hub for events, student profiles and community posts. Built with Next.js 16 (App Router), React and TypeScript, with plain CSS.

## Run it

You need Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Other checks:

```bash
npm run lint
npm run type-check
npm run build
```

To run a production build locally, use `npm run build`, then `npm start`.

## What's where

```
app/
  layout.tsx            Fonts, desktop/mobile navigation and the floating profile button
  globals.css           Bold pop design tokens, base styles and responsive navigation
  components.css        Shared page and component styles
  page.tsx              Home: calendar, daily highlights, teammate card, latest posts
  events/page.tsx       Events: filters, list view and calendar view
  students/page.tsx     Student directory with search and skill filters
  students/[id]/page.tsx  A student's public profile
  profile/page.tsx      Your own profile (shows completeness and Edit)
  community/page.tsx    Posts with tags, upvotes and a composer
components/              Reusable page components and shared navigation
  ui/                    Button, Card, Tag and labeled Input
lib/
  types.ts              Data shapes for events, students, highlights and posts
  data.ts               Sample data. Replace with real database queries
  colors.ts             Shared design-token colors for tags and event types
  dates.ts              Date helpers. "Today" uses the Asia/Kolkata timezone
.env.example             Placeholders for Supabase and the college email domain
```

## Next steps

1. **Real data.** Everything reads from `lib/data.ts`. Swap those arrays for queries to Supabase or Firebase; the types in `lib/types.ts` are a good starting schema.
2. **Sign-in.** `CURRENT_USER_ID` in `lib/data.ts` stands in for the logged-in student. Replace it with your auth session, and restrict sign-up to your college email domain.
3. **Saving.** New community posts and upvotes live only in the browser for now. Wire `submit` and the vote button in `components/CommunityFeed.tsx` to your backend.
4. **Submit an event.** The button is in place on Home and Events; it needs a form and an approval step.
