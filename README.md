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

1. The private tutor ad is played on the page, and its end card names `robotutor.ai`. Cut 8 went onto the page on 2026-11-18;
   the finished film (cut 15, one minute) replaced it on 2026-11-19.
2. Form entries are stored in Cameron's Cloudflare account (a free Worker and a D1 database), because GitHub
   Pages cannot receive form entries itself.
3. `robotutor.ai` points to this page as soon as the page works end to end. The product's servers are left
   running and untouched; shutting them down is a separate decision. Switched on 2026-11-19.
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

The Worker is served at `https://interest.robotutor.ai` (a Cloudflare custom domain set in `worker/wrangler.jsonc`;
its workers.dev address is switched off). That address appears in three places that must agree: the `Content-Security-Policy` tag and the form's
`action` in `docs/index.html`, and `docs/assets/config.js`. The Worker accepts posts only from the origins in
`ALLOWED_ORIGINS` (`worker/wrangler.jsonc`).

Deploy the Worker (needs a Cloudflare sign-in or API token on the machine; first deployed 2026-11-19):

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

The page plays the finished private tutor film, cut 15 (59.75 s; Cameron declared it finished and asked for it to
replace cut 8 on 2026-11-19). To replace it, overwrite `docs/assets/robotutor-private-tutor.mp4` (a web encode: 1080p
H.264, `-crf 24 -preset slower`, AAC 128k, `+faststart`, about 8.7 MB) and, if the board scene changes,
`docs/assets/film-poster.jpg` (a frame of the board scene, which cut 15 still contains). The page text states the
film's length (`docs/index.html`, the note under the player).

## Look

Paper white, ink and brand blue, with the robot in daylight, matching the daylight cut of the ad (Cameron,
2026-11-18: brighter and more cerebral, never dark or ominous).

## Domain switch: done on 2026-11-19

`robotutor.ai` serves this page. Cameron approved the exact records the same day ("Yes, both steps").

| Record | Before | Now |
|---|---|---|
| `robotutor.ai` | `CNAME` to Railway (`8kq1ib7z.up.railway.app`), proxied | four `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, DNS-only |
| `www.robotutor.ai` | `CNAME` to Railway (`wtsmlubx.up.railway.app`), proxied | `CNAME` to `weller-precision-industries.github.io`, DNS-only |
| `interest.robotutor.ai` | none | the form Worker's custom domain (Cloudflare creates and manages this record) |

The five MX records and the seven TXT records (SPF, DKIM, DMARC, Google and Railway verification) were not touched.
Nothing was changed in Railway: the product's servers still run and still have the domain attached; it just no
longer points to them. To go back, restore the two `CNAME` records above (proxied) and remove the custom domain in
the repository's Pages settings.

GitHub Pages: custom domain `robotutor.ai` (`docs/CNAME`; GitHub itself commits "Create CNAME" / "Delete CNAME" when
the setting changes), HTTPS enforced, certificate for `robotutor.ai` and `www.robotutor.ai`. `www`, plain `http` and
the old `github.io` address all redirect to `https://robotutor.ai/`.

What it took, for next time: the Cloudflare connector (`bindings.mcp.cloudflare.com`) has no DNS tools, so Cameron
made an API token. In Cloudflare's token editor an **Account** policy does not cover a domain's records; the token
also needs a **Zone** policy for `robotutor.ai` with DNS read and edit. The certificate was not requested while the
domain was set before DNS pointed at GitHub; removing and re-adding the custom domain started it, and it was issued
within a minute. A redirect through Railway had been considered on 2026-11-18 and rejected.
