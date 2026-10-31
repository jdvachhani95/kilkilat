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
    const bearWidth = Math.min(phone ? 150 : viewport.width < 1000 ? 180 : 235, viewport.height * .42);
    const startX = phone ? viewport.width * 0.64 - bearWidth / 2 : viewport.width * 0.78 - bearWidth / 2;
    const inset = phone ? 20 : 30;
    const wave = p * Math.PI * 6;
    const travelX = inset + Math.max(0, viewport.width - bearWidth - inset * 2) * (.5 + Math.cos(wave) * .5);
    const startY = phone ? (Number.isFinite(viewport.heroStartY)
      ? viewport.heroStartY : Math.max(490, viewport.height * 0.59)) : viewport.height * 0.2;
    const travelY = clamp(viewport.height * (.2 + Math.sin(wave) * .075),
      85, Math.max(85, viewport.height - bearWidth * 1.5 - 24));
    return {
      x: startX + (travelX - startX) * eased,
      y: startY + (travelY - startY) * eased,
      rotation: Math.sin(wave) * 6 * eased,
      width: bearWidth,
      depth: eased,
      opacity: 1 + ((phone ? .4 : .48) - 1) * eased
    };
  }

  function teddyOpacity(pose, regions = []) {
    // The portrait illustration is 2:3. Foreground reading areas obscure it
    // progressively; a small margin keeps the artwork away from text edges.
    const height = pose.width * 1.5;
    let coverage = 0;
    for (const region of regions) {
      const width = Math.max(0, Math.min(pose.x + pose.width, region.right + 12) - Math.max(pose.x, region.left - 12));
      const overlapHeight = Math.max(0, Math.min(pose.y + height, region.bottom + 12) - Math.max(pose.y, region.top - 12));
      coverage = Math.max(coverage, width * overlapHeight / (pose.width * height));
    }
    return pose.opacity * (1 - clamp(coverage / .8, 0, 1) * pose.depth);
  }

  return { countdown, rsvpIsOpen, validateRsvp, canSubmitRsvp, teddyPose, teddyOpacity };
}));
