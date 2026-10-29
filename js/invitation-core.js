(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InvitationCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function countdown(target, now = Date.now()) {
    const remaining = Math.max(0, Math.ceil((Date.parse(target) - now) / 1000));
    return {
      days: Math.floor(remaining / 86400),
      hours: Math.floor(remaining / 3600) % 24,
      minutes: Math.floor(remaining / 60) % 60,
      seconds: remaining % 60,
      started: now >= Date.parse(target)
    };
  }

  function rsvpIsOpen(deadline, now = Date.now()) {
    return now <= Date.parse(deadline);
  }

  function formatMonth(month) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long', year: 'numeric', timeZone: 'UTC'
    }).format(new Date(month + '-01T12:00:00Z'));
  }

  function validateRsvp(input) {
    const name = typeof input.name === 'string' ? input.name.trim().replace(/\s+/g, ' ') : '';
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    const errors = {};
    if (!name || name.length > 100) errors.name = 'Please enter your name (up to 100 characters).';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    for (const [key, min] of [['adults', 1], ['children', 0]]) {
      const raw = String(input[key] ?? '');
      if (!/^\d+$/.test(raw) || Number(raw) < min || Number(raw) > 20) {
        errors[key] = key === 'adults' ? 'Please enter 1–20 adults, including you.' : 'Please enter 0–20 children.';
      }
    }
    return { valid: Object.keys(errors).length === 0, errors,
      value: { name, email, adults: Number(input.adults), children: Number(input.children) } };
  }

  function canSubmitRsvp(deadline, input, attempt, now = Date.now()) {
    if (rsvpIsOpen(deadline, now)) return true;
    const checked = validateRsvp(input);
    return Boolean(attempt && attempt.requestId && checked.valid &&
      attempt.fingerprint === JSON.stringify(checked.value));
  }

  function teddyPose(progress, viewport) {
    const p = clamp(progress, 0, 1);
    const hero = clamp(viewport.heroProgress || 0, 0, 1);
    const eased = 1 - Math.pow(1 - hero, 3);
    const phone = viewport.width <= 720;
    const bearWidth = phone ? 150 : viewport.width < 1000 ? 180 : 235;
    const startX = phone ? viewport.width * 0.64 - bearWidth / 2 : viewport.width * 0.78 - bearWidth / 2;
    const edgeX = phone ? viewport.width - 65 : viewport.width - bearWidth * 0.56;
    const startY = phone ? (Number.isFinite(viewport.heroStartY)
      ? viewport.heroStartY : Math.max(490, viewport.height * 0.59)) : viewport.height * 0.2;
    const edgeY = viewport.height * (0.22 + Math.sin(p * Math.PI * 4) * 0.1);
    return {
      x: startX + (edgeX - startX) * eased,
      y: startY + (edgeY - startY) * eased,
      rotation: Math.sin(p * Math.PI * 7) * 7 * eased,
      width: bearWidth
    };
  }

  return { countdown, rsvpIsOpen, formatMonth, validateRsvp, canSubmitRsvp, teddyPose };
}));
