# Baby shower invitation design

Visual concept: [scrolling invitation](assets/baby-shower-scroll-concept.png). The portrait, map, countdown values and form styling in the concept are illustrative. Actual content and the selected form integration determine their final appearance.

The [updated RSVP concept](assets/baby-shower-rsvp-concept-v2.png), dated October 27, 2026, supersedes the RSVP section of the original scrolling concept.

## Purpose and audience

A personal, interactive invitation for approximately 35–40 families. Guests should enjoy discovering the invitation, find the practical information quickly, and RSVP with their name, email address, number of adults and number of children. The artwork should remain meaningful as a family keepsake after the event.

The hosts are **Jaydeep & Aruni**. The expected due date for the online reveal is **February 2027**. RSVPs are requested by **November 15, 2026**, inclusive of that day in Hamilton's timezone.

## Agreed visual direction

- Gender-neutral watercolor artwork inspired by the supplied screenshots, with an original composition.
- A floating teddy bear carrying pale balloons connects the opening invitation and the sections below.
- Illustrated portraits of the parents should resemble photographs supplied by the couple. Concept portraits are examples and must not be presented as their likenesses.
- Bright, cool off-white and very pale sage form the background. Avoid beige paper, sepia, heavy cream, yellow washes, and stereotyped gender colors.
- Suggested palette: background `#FAFCFA`, mist `#EDF5F0`, pale sage `#DDE9DF`, decorative leaf green `#7E997F`, readable text `#354F43`.
- White flowers and sparse foliage frame the content. Preserve generous clear space around text and controls.
- Use an elegant serif for headlines and a readable sans serif for practical information. Restrict script lettering to a short decorative accent, if used.

## Confirmed event date and on-the-day surprise

- Display date: **Sunday, November 29, 2026**.
- Calendar date: `2026-11-29`; the weekday has been checked against the calendar.
- Display time: **10:00 AM onwards**. No end time is specified.
- Use Hamilton's local timezone, **America/Toronto**. The countdown targets **November 29, 2026 at 10:00 AM EST**, represented as `2026-11-29T10:00:00-05:00`, independently of the visitor's timezone.
- Include a playful callout alongside the event details, below the countdown and before the gift note: **“One little secret, one big surprise! We’ll reveal baby’s gender at the shower.”**
- The gender reveal happens in person on the event day. Keep the invitation's palette gender-neutral, and keep the online scratch card specifically about the expected due date. Do not reveal gender through the website or add a guessing game without a further request.

## Continuous scrolling experience

1. **Opening invitation.** Begin with a light, almost empty watercolor canvas. The teddy floats into view and the invitation text and couple illustration appear. The introduction should be brief and scrollable immediately. An RSVP shortcut remains easy to reach.
2. **Due-date surprise.** An optional scratch card reveals the baby's expected due date. Touch, mouse, keyboard and a visible tap-to-reveal button reach the same result. The card must not block access to event information or RSVP. Treat this as playful discovery; the date is accessible to visitors, rather than confidential or protected by the scratch layer.
3. **Event details and countdown.** Clearly display **Sunday, November 29, 2026 · 10:00 AM onwards**, in Hamilton's local time, and relevant attendance details. The countdown targets the baby shower, independently of the expected due date. At the start of the event, replace the countdown with a celebratory message. Beneath the countdown, include the playful on-the-day gender-reveal callout specified above. Beneath the event details and before the venue section, include the hosts’ chosen gift note verbatim: “If you’d like to bring a little something, we’d appreciate a gift card or contribution towards our baby’s needs in place of physical gifts.” This expresses the hosts’ preference for cash or gift cards while keeping gifting optional. Use readable, understated text with the same soft sage styling as the invitation. Do not add registry or payment links without the hosts asking.
4. **Venue.** Show an original illustrated map preview derived from the actual venue and nearby streets or landmarks. Also provide the readable venue name and address and an **Open Google Maps** button linked to the hosts’ supplied Magnolia Hall URL: **https://maps.app.goo.gl/ggcyZocf3u9xvAgi6**. The illustration is decorative guidance; the button provides real navigation.
5. **RSVP.** Use warm, humble invitation wording and collect the guest or family name, email address, adults and children separately. Label the adult count as including the person responding so children are not counted twice. Present a clear confirmation after a successful submission and an actionable message if submission fails. The form should be comfortably usable on a phone.

## Venue map — updated October 27, 2026

Create an original pale sage watercolor illustration from the hosts’ supplied Google Maps screenshot showing Magnolia Hall and City Hall Parking. Preserve the source street layout and landmark positions. Replace the generic map used in the initial concept with this location-specific artwork.

Illustrated map asset: [Magnolia Hall and City Hall Parking](../../../img/magnolia-hall-parking-map-v1.png). Building drawings are illustrative; use the verified Google Maps destination for live directions.

The most prominent parking callout must read **“Park here”**, with **“City Hall Parking”** below it. Anchor the pointer inside the actual City Hall Parking area, on the upper-right side of Hunter St W in the supplied screenshot. Mark Magnolia Hall separately at the source venue pin, below Hunter St W and left of the central intersection. Keep The Hamilton Peace Garden and Central Elementary School as secondary landmarks. Label Hunter St W and Park St S, and preserve the shown one-way directions. Do not guess the name of the central street, a parking entrance or a pedestrian route absent from the source.

Keep the artwork bright and readable on phones, with cool off-white space and restrained sage detail. The live Google Maps link provides navigation to a verified destination; the illustrated map must not imply a verified parking entrance or route.

The **Open Google Maps** button opens **Magnolia Hall**, using the exact host-provided link [https://maps.app.goo.gl/ggcyZocf3u9xvAgi6](https://maps.app.goo.gl/ggcyZocf3u9xvAgi6). The illustrated **Park here** marker identifies City Hall Parking separately; do not silently replace the button destination with parking.

## RSVP wording and fields — updated October 27, 2026

Replace the original concept's “Save your seat” heading with **“We’d love to have you with us”**.

Supporting copy: “Your presence would mean so much to us. Please let us know how many of you will be joining us.”

Fields, in reading order:

1. **Your name** — required; the responding guest or family name.
2. **Email address** — required; validate the address format without requiring Google sign-in. Do not imply an automatic confirmation email until that feature exists.
3. **Adults** — required whole-number count, including the respondent; default 1 and minimum 1.
4. **Children** — separate whole-number count; default 0 and minimum 0.

Use full-width name and email inputs on phones. Adult and child counts can sit beside one another when space permits, with touch-friendly controls and a clear “Including you” hint under Adults. Total attendance is adults plus children; do not show an ambiguous additional total-people question.

Submit button: **“Send RSVP”**.

Success copy: “Thank you for letting us know. We’re looking forward to celebrating with you!”

## Teddy motion

One decorative teddy follows a gentle path as the page scrolls. Its position is driven by scroll progress, with subtle balloon sway. On phones it stays along section edges and in clear background spaces; on desktop it has more space in the side margins. It must not cover text, interfere with touch targets, capture pointer input, or require guests to wait for an animation to finish. With reduced motion enabled, use a static illustration and immediately visible content.

## Responsive behavior

Design for narrow phone screens first, with a single clear reading order and comfortable text and tap sizes. On desktop, expand the artwork into the margins and use balanced adjacent content where useful, such as a venue illustration beside the address. Keep the same continuous vertical story instead of enlarging a phone-shaped column or stretching images. The site must remain usable while artwork loads and if animation is unavailable.

## RSVP and privacy

The site remains on GitHub Pages and its URL is shared directly with guests. The published site is publicly accessible; the response Sheet stays restricted to the hosts and co-hosts. Do not publish the guest list or responses in the repository or website.

Implementation uses the already agreed **custom form with an Apps Script receiver** to preserve the approved styling and separate count controls. Independently validate the name, email address and separate integer counts on the server. Store adult and child counts in separate response columns. Do not rely on browser validation or a secret in public JavaScript. The receiver source and deployment steps are included in the project; live submissions require the hosts' deployment URL. No Google Form or Apps Script deployment URL has been supplied yet, and the page must not falsely claim to store responses before connection. An optional official Google Form link can replace the custom form if the hosts choose that route.

## Keepsake intent

Keep invitation artwork and the family illustration suitable for later reuse as a static memory page. Do not add guest messages, public galleries, gender guesses, or additional personal-data collection without a separate request. After the event the RSVP form can be closed while the invitation remains available.

## Content needed before publishing

- Photos of the two parents suitable for creating recognizable illustrated portraits. Their display names, Jaydeep & Aruni, have been supplied.
- Magnolia Hall's display address if the hosts want a street address alongside the venue name. The shower date, 10:00 AM onwards start, local timezone, RSVP deadline, venue name and Google Maps link are recorded. Do not invent an end time or street address.
- The hosts' deployed Apps Script receiver URL and private response Sheet, or their official Google Form URL if choosing that alternative. Source and setup instructions are provided.

Do not infer these personal details from template content, reference screenshots, account names, or sample artwork.

## Review criteria for implementation

Check readable text, phone and desktop layouts, an uninterrupted reading order, non-obstructive teddy motion, the reduced-motion presentation, the scratch and tap reveal, the countdown's target and timezone, the real maps destination, and the selected RSVP submission flow. Never send a sample RSVP to a live host form without the hosts' authorization.
