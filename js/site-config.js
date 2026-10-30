/* Public invitation settings. Never put Google credentials or private keys here. */
window.INVITATION_CONFIG = Object.freeze({
  parents: 'Aruni & Jaydeep',
  eventStart: '2026-11-29T10:00:00-05:00',
  arrivalMonth: 'February',
  rsvpDeadline: '2026-11-15T23:59:59-05:00',
  mapsUrl: 'https://maps.app.goo.gl/ggcyZocf3u9xvAgi6',
  // Leave empty: the Pages build fills this from the RSVP_ENDPOINT repo secret.
  // The deployed URL is visible to visitors; never use this for credentials.
  rsvpEndpoint: '',
  // Optional official Google Form URL, used instead if you prefer Google Forms.
  googleFormUrl: '',
  // Add the illustrated portrait created from your own photos when available.
  portraitImage: ''
});
