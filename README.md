# sbttld Studio

Brand-locked social and ad creative for Subtitled's clients. Subtitled sets up each client's
fonts, colours, logo and templates; the client edits the words, picture and music once, and
every social format and ad size updates together. They export PNG or animated video, one at a
time or all at once as a ZIP, and save designs to come back to.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
```

Use **View as → Subtitled / Client** in the top right to switch between the agency's
brand-setup view and the locked view a client sees.

## How it works

| Piece | File |
| --- | --- |
| Data model: client, brand kit, template, design | `src/types.ts` |
| Every format and ad size | `src/formats.ts` |
| Starter templates and two demo clients | `src/templates.ts` |
| One canvas renderer for previews, PNG and video | `src/render.ts` |
| PNG, video (with audio) and ZIP export | `src/exporters.ts` |
| Plan gating (Essentials vs Studio) | `src/plans.ts` |

**One design, every size.** A template defines each element (image, headline, button,
logo…) for six canvas shapes: square, portrait, story (9:16), landscape, banner and
skyscraper. Each format picks its shape from its aspect ratio, and text shrinks to fit its
box, so one headline works from 1080×1920 down to a 320×50 mobile banner. In vertical
formats the text stays out of the areas where Stories, Reels and TikTok draw their own buttons.

**Locked brand.** Clients only see the fields a template exposes. Colours, fonts, logo and
layout are tokens that Subtitled controls in Brand setup.

**Plans.**

| | Essentials | Studio |
| --- | --- | --- |
| Social formats, PNG export | ✓ | ✓ |
| IAB ad sizes | | ✓ |
| Animated video export | | ✓ |
| Music / audio | | ✓ |
| Saved designs | 25 | Unlimited |

Prices in `src/plans.ts` are placeholders.

## From prototype to product

This prototype runs entirely in the browser and saves to the browser's own storage
(IndexedDB). To sell it on subscription:

1. **Accounts and teams.** Sign-in (Clerk or Supabase Auth) with roles. Subtitled staff
   get the agency role; client users belong to a single client and only ever get the locked view.
2. **Database and file storage.** Move clients, templates and designs into Postgres
   (e.g. Supabase), and logos, fonts, images and audio into object storage (S3 or Cloudflare R2).
3. **Billing.** Stripe Checkout and Customer Portal. A webhook writes the active plan to
   the client record, and the existing `PLANS` gating reads it.
4. **Server-side video rendering.** In-browser recording runs in real time, needs the tab
   to stay visible, and some browsers produce WebM or VP9. Render on a server instead with the
   same `render.ts` drawing code (node-canvas + ffmpeg, or Remotion), so every client gets
   H.264 MP4s that Instagram, TikTok and Meta Ads accept.
5. **A visual template builder** for Subtitled staff, replacing the JSON editor.
6. **Next features:** a brand image library per client, a shared music library with
   licensed tracks, per-format text overrides, more animation styles, and scheduling
   or publishing straight to Meta and LinkedIn.

**Font licensing:** many commercial fonts need an app or web-embedding licence before they
can be used in a tool like this. Check each client's licence before uploading their fonts.
