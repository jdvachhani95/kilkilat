# Invitation setup

The invitation is a static GitHub Pages site. No Node dependencies, frontend build framework, paid hosting, public spreadsheet, or visitor login is required.

## Preview and checks

Open `index.html` in a browser for a disconnected preview, or run `npm run dev` and open `http://localhost:4173`. The dev command builds first, loads the local `.env` if present, and serves only `_site/`, so the source environment file is not served. Restart it after changing source files or `.env`. Node 22 or later runs `npm test`, `npm run check`, and `npm run build`. Python 3 is needed only for the optional local preview command. The build writes an allowlisted set of public files to `_site/`; it excludes environment files, original template assets, docs, tests and server source.

## Host settings

Edit `js/site-config.js`. The confirmed names, event date, arrival month, deadline and Magnolia Hall link are already entered. All values in this file are public. Never add Google credentials or private API keys.

The event is November 29, 2026, **10 AM onwards**, Hamilton time. The fixed countdown timestamp is `2026-11-29T10:00:00-05:00`. No end time is invented. The scratch card says “See you in February!”; no due day or year is stored in the public configuration. The gender reveal takes place in person at the shower. RSVPs close after November 15, Hamilton time. If the deadline changes, update it in both the site configuration and Apps Script.

## Connect the custom RSVP form to a private Sheet

The form is implemented, but it cannot store live responses until the hosts deploy their receiver. With an empty `rsvpEndpoint`, the invitation clearly says the form is not ready and disables submission. It never claims to save an RSVP without a confirmed server receipt.

1. Open [Google Apps Script](https://script.google.com/) in the account that should own the response Sheet, and create a new project.
2. Paste the contents of `apps-script/Code.gs` into the project's `Code.gs`.
3. In Project Settings, enable the `appsscript.json` manifest in the editor, and use the contents of `apps-script/appsscript.json`. The script uses the Sheets scope and Hamilton's timezone; it does not send email or need Gmail access.
4. Run `setup` once and authorize your own script. This creates a new private Sheet with columns for received time, name, email, adults, children, total and request ID. Its URL appears in the execution log. Re-running setup reuses the same Sheet.
5. Share **that Sheet** only with your co-hosts. Do not publish it or turn on public link sharing.
6. Select **Deploy → New deployment → Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Guests need anonymous access to submit; the script uses your permissions to write to the private Sheet. Deployment availability can depend on your Google Workspace administrator.
7. Copy the deployed URL ending in `/exec`. In your GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**. Name it **RSVP_ENDPOINT** and paste the URL as its value. Leave `rsvpEndpoint` empty in `js/site-config.js`.
8. After the updated workflow is pushed, run the Pages workflow on the branch you intend to deploy, or push to `main` or `master`. Adding or changing a secret alone does not trigger deployment. The build inserts the URL into `_site/js/site-config.js`, leaving the source configuration unchanged. Invalid nonempty URLs fail the build; without a secret, the default custom form stays disabled.
9. Reload the deployed invitation. The form becomes available until the RSVP deadline. Make one explicitly authorized test response yourself and confirm that it appears in the private Sheet before sharing the invitation.

The repository secret prevents the URL from appearing in committed source. The deployed JavaScript and browser requests still expose it to visitors, because the browser submits directly to Apps Script. Keep the response Sheet restricted; endpoint secrecy is not guest authentication. Never place Google credentials or Sheet contents in this setting.

For local use, put the same deployed `/exec` URL in the root `.env` file:

```dotenv
RSVP_ENDPOINT=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

The build loads `.env` automatically. Existing shell or GitHub Actions environment values take priority. `.env` and its variants are ignored by Git; `.env.example` contains only an empty template. Run `npm run dev` to build and preview with the configured endpoint. Opening the source `index.html` directly does not load `.env`. Keep the GitHub `RSVP_ENDPOINT` repository secret configured separately for deployment, since `.env` is not pushed.

When editing the Apps Script later, update its deployment to a new version. Merely saving editor changes does not update the deployed version. Keep its existing deployment URL when possible.

The receiver independently validates names, email and whole-number adult/child counts. It rejects the hidden honeypot field, prefixes formula-like text before writing, serializes writes with a lock, and recognizes a retried request ID. It has a modest per-email rate limit, not guest authentication. The endpoint is public; do not treat its URL as a secret. A repeat submission after reloading can create another row; request IDs prevent network retries from creating duplicates, not all household resubmissions.

The browser sends an ordinary form-encoded request and waits for JSON with the matching receipt ID. Do not use `no-cors` or an unconditional thank-you state: an opaque response cannot confirm storage. If the browser cannot read the response, check anonymous deployment access, Workspace restrictions and the execution log. A request may have reached the Sheet even when its response is lost; retrying the unchanged form uses the same ID. An unchanged attempt can recover its saved receipt even if the deadline passes while waiting. New or changed submissions remain closed after the deadline.

Guest details remain in the form's memory during a retry. They are not written to local storage. The optional due-date-reveal preference is the only value persisted in the visitor's browser. The email field is collected for the hosts; automatic email confirmations are not implemented or promised.

## Optional Google Forms route

If you prefer an official Google Form instead of deploying Apps Script, create one with name, email, adults (including the respondent), and children. Link responses to a restricted Sheet. Paste its public responder URL into `googleFormUrl` and leave `rsvpEndpoint` empty. The invitation then shows a button to the official form instead of the custom inputs. Turn off settings that require guest sign-in unless that is intentional. Google Forms controls its own field styling and closure settings; close responses there too when the deadline passes.

## Couple portrait

The real photos have not been supplied, so the invitation uses teddy and floral artwork without unrelated people. When the personal illustration is ready, place it inside `img/invitation/`, set `portraitImage` to its relative path, and add that file to the allowlist in `scripts/build.cjs`. The portrait appears in the hero artwork. Keep its colors and background compatible with the light sage design.

## Publish to GitHub Pages

1. Push the reviewed project to your own repository. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
2. The included `pages.yml` workflow runs checks and deploys `_site/` after a push to `main` or `master`, or when manually dispatched. The implementation branch itself is not automatically published.
3. Open the URL provided by GitHub's deployment and check it on a phone. Relative asset links support project sites under `/repository-name/`.

The template author's `CNAME` has been removed. Add your own only if you have configured a custom domain, and include it in the build allowlist. A private source repository does not normally make the published site private. Only the invitation is deployed; the response Sheet stays in your Google account.

## Interaction checks

- Scroll through the page: one teddy moves from the hero toward the outer edge, with a gentle sway. It cannot intercept taps. Reduced-motion mode uses a stationary hero illustration.
- Scratch the baby-arrival card with touch or a mouse, or use the keyboard-accessible reveal button. Reloading preserves an already revealed card when local storage is available.
- The countdown uses Hamilton's start time even when the visitor is elsewhere. At the start it becomes a celebratory message.
- The calendar button downloads an `.ics` with the correct start, venue and maps link. No end time is added.
- Enlarge the parking map, use the zoom controls, and close with the close button, Escape or the backdrop.
- On the custom form, check invalid inputs, count limits and a network failure using a test receiver before launch. A success requires a matching server receipt. No production responses were sent during development.

For automated browser checks, install Playwright separately in your development environment and run `npm run test:browser`. An optional `PLAYWRIGHT_EXECUTABLE_PATH` selects an existing Chromium executable. These checks use local files and mocked form responses, not a real guest Sheet. Screenshots are written to ignored `test-results/`.
