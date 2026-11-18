# robotutor-site

The placeholder page for Robotutor while the product is paused: the robot, a short "paused for now" message, an
interest form, and the private tutor film. It is a plain static page (no build step) hosted free on GitHub Pages.

© Robotutor, Inc. All rights reserved. The Robotutor name, logo, robot and film are not open source.
The fonts in `docs/assets/fonts/` (Nunito, IBM Plex Serif, IBM Plex Mono) are under the SIL Open Font License.

## Layout

| Path | What it is |
|---|---|
| `docs/` | The page GitHub Pages serves (Pages source: branch `main`, folder `/docs`). |
| `docs/index.html`, `docs/assets/site.css`, `site.js` | The page, its styles, and the form and film behaviour. |
| `docs/assets/config.js` | The address the form is sent to. |
| `worker/` | The Cloudflare Worker that receives the form and stores each entry. Not served by Pages. |

## Decisions (Cameron Weller, 2026-11-18)

1. The private tutor ad is played on the page, and its end card names `robotutor.ai`. Cut 8 went onto the page on 2026-11-18.
2. Form entries are stored in Cameron's Cloudflare account (a free Worker and a D1 database), because GitHub
   Pages cannot receive form entries itself.
3. `robotutor.ai` points to this page as soon as the page works end to end. The product's servers are left
   running and untouched; shutting them down is a separate decision.
4. This repository is public and holds page files only, so Pages stays free on any GitHub plan.

Added beyond the request: a privacy line, a success message, link-preview tags, a hidden field that catches
form-filling bots, and an age line. Robotutor's terms limit accounts to adults, and teens are part of the
audience of an education product, so the list is for people aged 18 or over.

## Where entries land, and how to read them

Each entry is one row in the D1 database `robotutor-interest` (id `69f58930-a784-4b21-a2fa-924aeebb7795`) in
Cameron's Cloudflare account: `email`, `name` (may be empty), `created_at`, `updated_at`, `source`. No IP
address is stored and the Worker keeps no request logs. A repeat entry from the same email updates its row.

To read them: Cloudflare dashboard → Storage & Databases → D1 → `robotutor-interest` → Console, then

```sql
SELECT email, name, created_at FROM interest ORDER BY created_at DESC;
```

To remove someone who asks: `DELETE FROM interest WHERE email = 'name@example.com';`

Entries must never be copied into this repository or any other public place.

## The form endpoint

The Worker's address appears in three places that must agree: the `Content-Security-Policy` tag and the form's
`action` in `docs/index.html`, and `docs/assets/config.js`. The Worker accepts posts only from the origins in
`ALLOWED_ORIGINS` (`worker/wrangler.jsonc`).

Deploy the Worker (needs a Cloudflare sign-in on the machine):

```bash
cd worker && npx wrangler deploy
```

Run it locally with a local database:

```bash
cd worker && npx wrangler d1 execute robotutor-interest --local --file schema.sql && npx wrangler dev --local
```

## Changing the page

Edit the files in `docs/` and push to `main`; GitHub Pages republishes within a minute or two.

## The film

The page plays cut 8 of the private tutor ad (42 s, approved by Cameron on 2026-11-18). To replace it, overwrite
`docs/assets/robotutor-private-tutor.mp4` (a web encode: 1080p H.264, about 6 MB, `+faststart`) and
`docs/assets/film-poster.jpg`.

## Look

Paper white, ink and brand blue, with the robot in daylight, matching the daylight cut of the ad (Cameron,
2026-11-18: brighter and more cerebral, never dark or ominous).
