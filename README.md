# A little love is on the way

Aruni & Jaydeep's baby shower invitation. **Sunday, November 29, 2026 · 10 AM onwards · Magnolia Hall, Hamilton.**

A responsive, buildless website for GitHub Pages, with watercolor artwork, a teddy that drifts as guests scroll, a scratch-to-reveal due date, a timezone-aware countdown, calendar download, an illustrated parking map and a custom RSVP form.

## Run locally

Open `index.html` in your browser for a disconnected preview. For local RSVPs, copy `.env.example` to `.env`, set `RSVP_ENDPOINT` to your Apps Script `/exec` URL, then run `npm run dev` and visit `http://localhost:4173`. The dev command builds and serves `_site/`; restart it after edits. No dependency installation or Sass compilation is needed for the invitation.

```sh
npm test
npm run check
npm run build
```

Node 22 or newer runs these commands. The build writes only the invitation's public files to `_site/`.

## Connect RSVPs and publish

See [the setup guide](docs/SETUP.md). The Google Apps Script receiver is included in `apps-script/`; it creates a private response Sheet and validates every submission. Store its deployed `/exec` URL in the GitHub Actions repository secret `RSVP_ENDPOINT`, and leave `rsvpEndpoint` empty in `js/site-config.js`. The Pages build inserts the URL into the published configuration. Visitors can still see the endpoint in the deployed site. An official Google Form URL is also supported as an alternative.

No live receiver has been configured yet, so the current page explicitly shows that RSVP collection is not ready. A successful confirmation is shown only after a matching server receipt. The actual couple portrait can be added after the hosts supply photos.

GitHub Pages deployment is defined in `.github/workflows/pages.yml`. Choose GitHub Actions as the Pages source in your own repository. No deployment has been made by this implementation.

## Project files

- `index.html`: invitation content and accessible controls.
- `css/invitation.css`: pale sage styling, responsive layouts and motion preferences.
- `js/site-config.js`: host content and submission destination.
- `js/invitation-core.js`: dates, validation and teddy positioning.
- `js/invitation.js`: scrolling, scratching, calendar, map and form interactions.
- `apps-script/`: the Google Sheets receiver and its manifest.
- `tests/`: date, validation, backend and optional isolated browser checks.
- `docs/superpowers/specs/`: approved design notes and visual concepts.

The rendered site loads losslessly encoded WebP artwork; the source PNGs are retained in the project. Original wedding-template assets remain for reference and are excluded from the public build.

## Attribution

This project began from [Ram Patra's wedding website](https://github.com/rampatra/wedding-website). The original GPL-3.0 license is preserved in [LICENSE](LICENSE). The current baby shower page, illustrations and interactions were created for this invitation.
