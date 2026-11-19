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

## Domain switch: state on 2026-11-18

Cameron asked for `robotutor.ai` to be switched to this page "with session tools and mcps". It could not be done that
day: the connected Cloudflare connector (`bindings.mcp.cloudflare.com`) has no DNS or Worker-deploy tools, the
Cloudflare dashboard signs in through GitHub and needs his password, and no Cloudflare token exists on the machine.
Cloudflare's full API connector (`https://mcp.cloudflare.com/mcp`) covers both DNS and Workers once he authorizes it.

A redirect through Railway was also considered and rejected the same day: `robotutor.ai` is a custom domain on the
production `OLMS` service (CNAME `8kq1ib7z.up.railway.app`, verified). Moving it to another Railway service means
removing it and adding it again, and Railway then asks for a new CNAME and a TXT verification record in DNS, which
cannot be created without Cloudflare access; the domain would be left serving nothing, with no way back. Nothing was
changed in Railway.

Steps when access exists (record the current records first):

1. Deploy `worker/` and put its address into `docs/index.html` (three places) and `docs/assets/config.js`.
2. Submit a labelled test entry from the github.io page and see it in D1; delete it.
3. DNS: apex `A` records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and `www` as
   `CNAME` to `weller-precision-industries.github.io`, both DNS-only. Leave MX, TXT and every other record alone.
4. Add `docs/CNAME` containing `robotutor.ai`, set the custom domain in the repository's Pages settings, and enforce
   HTTPS once the certificate is issued.
