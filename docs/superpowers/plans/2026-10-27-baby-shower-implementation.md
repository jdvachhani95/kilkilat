# Baby shower invitation implementation plan

**Goal:** Implement the approved mobile-first invitation for Jaydeep & Aruni, with one scroll-following teddy, a due-date scratch card, event countdown, venue illustration, and a custom RSVP form connected through Google Apps Script to a private Sheet.

**Architecture:** Buildless HTML, CSS and ordinary JavaScript served from GitHub Pages. Separate host configuration, testable date/validation/motion logic, browser interactions and the Apps Script receiver. No framework, analytics, client credentials or third-party animation library.

**Known content:** Shower November 29, 2026, 10 AM onwards, America/Toronto; due date February 2027; RSVP deadline November 15, 2026. Use the supplied Magnolia Hall maps URL and parking illustration. The parents' actual portrait photos and deployed form endpoint have not been provided.

## Execution

- [x] Create meaningful failing Node tests for the event deadline/countdown, count validation, teddy path bounds and Apps Script receipt handling.
- [x] Implement `js/site-config.js` and `js/invitation-core.js`. Use explicit timezone offsets, a month-only expected arrival, named validation failures, and one safe animation path bounded to decorative space.
- [x] Generate and save independent transparent teddy and floral artwork under `img/invitation/`. Use supplied venue illustration. Do not present unrelated couple portraits as Jaydeep and Aruni.
- [x] Replace `index.html` and add `css/invitation.css`: semantic navigation, hero, scratch reveal, event details/countdown, exact gift note, venue/map dialog and RSVP. Support phone and desktop, keyboard, reduced motion and no-JavaScript informational content.
- [x] Add `js/invitation.js`: requestAnimationFrame-based scroll motion, progress, intersection reveals, touch/mouse scratch and keyboard reveal, date countdown, calendar download, zoomable map, count controls, honest validated form submission and error recovery.
- [x] Add `apps-script/Code.gs` and `appsscript.json`: validate all fields server-side, respect the RSVP deadline, escape spreadsheet formulas, serialize writes, recognize retried request IDs, reject bot honeypots and avoid exposing response data.
- [x] Document setup in `docs/SETUP.md`, including the private Sheet and anonymous execute-as-owner deployment. Clearly report that live collection awaits the hosts' deployment URL.
- [x] Remove the inherited template-author CNAME so that domain is not configured. Add a static GitHub Pages deployment workflow. Preserve unrelated original assets and license.
- [x] Run focused Node tests, JavaScript syntax checks, static HTML/link checks and the static build. Review code and resolve the deadline-retry finding. Do not send a test RSVP to a real endpoint.
- [ ] Run `tests/browser-check.cjs` successfully on a machine that permits Chromium. Current environment denies both browser launch and localhost listeners; CUA has no browser surface. Visual layout, scratch gestures, actual map dialog behavior and touch interactions remain unverified. Browser checks are provided but have not passed here.

## Review criteria

Match the approved pale sage/off-white style without beige backgrounds. The teddy must visibly change position with scrolling while never intercepting inputs. The reveal discloses only the expected due date; gender is revealed at the event. The countdown is fixed to 10 AM Hamilton time. Both people counts and email must be independently validated. A missing endpoint or network failure must never show a false saved confirmation.

Execute inline in the existing checkout. The repository has no initial commit, so an isolated worktree cannot reproduce the existing untracked template and design assets; use the feature branch without committing unrelated files.
