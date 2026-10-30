(function () {
  'use strict';
  const config = window.INVITATION_CONFIG;
  const core = window.InvitationCore;
  if (!config || !core) return;
  const byId = (id) => document.getElementById(id);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-parents]').forEach((el) => { el.textContent = config.parents; });
  byId('due-date').textContent = 'See you in ' + config.arrivalMonth + '!';
  if (config.portraitImage) {
    const portrait = byId('couple-portrait');
    portrait.src = config.portraitImage;
    portrait.hidden = false;
  }
  byId('maps-link').href = config.mapsUrl;
  document.querySelector('.map-dialog-footer > a').href = config.mapsUrl;

  function initMotion() {
    const teddy = byId('floating-teddy');
    const stage = byId('teddy-stage');
    const progressBar = byId('scroll-progress');
    let pending = false;
    function update() {
      pending = false;
      const scroll = window.scrollY;
      stage.style.height = motion.matches ? byId('welcome').offsetHeight + 'px' : '';
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, scroll / max)) : 0;
      const phone = window.innerWidth <= 720;
      const artTop = document.querySelector('.hero-art').getBoundingClientRect().top + scroll;
      const travelStart = phone ? Math.max(0, artTop - window.innerHeight * 0.45) : 0;
      const heroProgress = motion.matches ? 0 : Math.max(0, Math.min(1, (scroll - travelStart) / (window.innerHeight * 0.65)));
      const pose = core.teddyPose(motion.matches ? 0 : progress, {
        width: window.innerWidth, height: window.innerHeight, heroProgress,
        heroStartY: phone ? artTop + 8 - (motion.matches ? 0 : scroll) : undefined
      });
      teddy.style.width = pose.width + 'px';
      teddy.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 0) rotate(${pose.rotation}deg)`;
      teddy.classList.toggle('is-traveling', heroProgress > 0.8);
      progressBar.style.transform = `scaleX(${progress})`;
    }
    function schedule() { if (!pending) { pending = true; requestAnimationFrame(update); } }
    function preferenceChanged() {
      document.body.classList.toggle('motion-reduced', motion.matches);
      schedule();
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    motion.addEventListener('change', preferenceChanged);
    preferenceChanged();
    update();
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -25px 0px' });
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => revealObserver.observe(el));
      document.documentElement.classList.add('js');
      const navObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          document.querySelectorAll('.site-header nav a').forEach((link) => {
            if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
      ['welcome', 'celebrate', 'venue', 'rsvp'].forEach((id) => navObserver.observe(byId(id)));
    }
  }

  function initCountdown() {
    function update() {
      const value = core.countdown(config.eventStart);
      ['days', 'hours', 'minutes', 'seconds'].forEach((key) => {
        byId('countdown-' + key).textContent = String(value[key]).padStart(2, '0');
      });
      if (value.started) {
        byId('countdown').hidden = true;
        byId('countdown-caption').textContent = 'Today’s the day! We can’t wait to see you.';
      }
      return value.started;
    }
    if (!update()) {
      const timer = setInterval(() => { if (update()) clearInterval(timer); }, 1000);
    }
    byId('add-to-calendar').hidden = false;
    byId('add-to-calendar').addEventListener('click', () => {
      const escape = (text) => text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
      const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aruni and Jaydeep//Baby Shower//EN',
        'BEGIN:VEVENT', 'UID:jaydeep-aruni-baby-shower-20261129@invitation.local',
        'DTSTAMP:' + stamp(new Date()), 'DTSTART:' + stamp(new Date(config.eventStart)),
        'SUMMARY:' + escape(config.parents + ' — Baby shower & gender reveal'),
        'LOCATION:Magnolia Hall\\, Hamilton\\, Ontario',
        'DESCRIPTION:' + escape('Baby shower and gender reveal, 10 AM onwards. Please park at City Hall Parking. Directions to Magnolia Hall: ' + config.mapsUrl),
        'URL:' + config.mapsUrl, 'END:VEVENT', 'END:VCALENDAR'];
      const url = URL.createObjectURL(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Aruni-and-Jaydeep-baby-shower.ics';
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  function initScratch() {
    const canvas = byId('scratch-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const area = byId('scratch-area');
    const content = byId('due-date-content');
    const button = byId('reveal-date');
    const storageKey = 'ja:arrival-revealed:' + config.arrivalMonth;
    let revealed = false;
    let activePointer = null;
    let last = null;
    try { revealed = localStorage.getItem(storageKey) === 'yes'; } catch (_) { /* Storage is optional. */ }

    function reveal(announce = true) {
      revealed = true;
      byId('scratch-card').classList.add('is-revealed');
      content.removeAttribute('aria-hidden');
      const hadFocus = document.activeElement === button;
      button.hidden = true;
      byId('scratch-after').hidden = false;
      if (announce) byId('reveal-announcement').textContent = 'Baby is arriving in ' + config.arrivalMonth + '!';
      if (hadFocus) { content.tabIndex = -1; content.focus({ preventScroll: true }); }
      try { localStorage.setItem(storageKey, 'yes'); } catch (_) { /* The reveal works without storage. */ }
      setTimeout(() => { canvas.hidden = true; }, motion.matches ? 0 : 700);
    }

    if (revealed) { reveal(false); return; }
    content.setAttribute('aria-hidden', 'true');
    button.hidden = false;
    button.addEventListener('click', () => reveal());
    if (!ctx) return; // Keyboard/tap reveal still works without canvas.

    function paint() {
      if (revealed) return;
      const width = area.clientWidth;
      const height = area.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width === Math.round(width * ratio) && canvas.height === Math.round(height * ratio)) return;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#d9e5d9'); gradient.addColorStop(0.5, '#e8efe5'); gradient.addColorStop(1, '#cddfcf');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < 110; i++) {
        ctx.fillStyle = i % 2 ? '#ffffff50' : '#a7bca81a';
        ctx.beginPath(); ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3 + 0.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#506e56';
      ctx.font = '24px Georgia'; ctx.fillText('♡', width / 2, height / 2 - 32);
      ctx.font = `italic ${width < 320 ? 18 : 23}px Georgia`;
      ctx.fillText('A hello from baby awaits', width / 2, height / 2 + 1);
      ctx.font = '10px -apple-system, sans-serif'; ctx.fillStyle = '#617b65';
      ctx.fillText('SCRATCH GENTLY TO DISCOVER', width / 2, height / 2 + 30);
      canvas.hidden = false;
    }
    function point(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }
    function erase(position) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 38; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(last ? last.x : position.x, last ? last.y : position.y);
      ctx.lineTo(position.x, position.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(position.x, position.y, 19, 0, Math.PI * 2); ctx.fill();
      last = position;
    }
    canvas.addEventListener('pointerdown', (event) => {
      if (revealed || activePointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
      activePointer = event.pointerId; last = null;
      canvas.setPointerCapture(event.pointerId); erase(point(event));
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!revealed && event.pointerId === activePointer) erase(point(event));
    });
    function stop(event) {
      if (event.pointerId !== activePointer) return;
      activePointer = null; last = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let empty = 0, sampled = 0;
      for (let i = 3; i < pixels.length; i += 64) { sampled++; if (pixels[i] < 50) empty++; }
      if (sampled && empty / sampled >= 0.32) reveal();
    }
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    paint();
    if ('ResizeObserver' in window) new ResizeObserver(paint).observe(area);
    else window.addEventListener('resize', paint, { passive: true });
  }

  function initMap() {
    const dialog = byId('map-dialog');
    let zoom = 1;
    function updateZoom() {
      byId('large-map').style.width = (zoom * 100) + '%';
      byId('map-zoom-label').textContent = Math.round(zoom * 100) + '%';
      byId('map-zoom-out').disabled = zoom <= 1;
      byId('map-zoom-in').disabled = zoom >= 3;
    }
    byId('open-map').addEventListener('click', () => {
      if (!dialog.showModal) { window.open('img/magnolia-hall-parking-map-v1.webp', '_blank', 'noopener'); return; }
      zoom = 1; updateZoom(); dialog.showModal(); document.body.classList.add('modal-open');
    });
    byId('close-map').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    byId('map-zoom-in').addEventListener('click', () => { zoom = Math.min(3, zoom + 0.5); updateZoom(); });
    byId('map-zoom-out').addEventListener('click', () => { zoom = Math.max(1, zoom - 0.5); updateZoom(); });
  }

  function initRsvp() {
    const form = byId('rsvp-form');
    const submit = byId('submit-rsvp');
    const availability = byId('form-availability');
    const status = byId('form-status');
    const fields = { name: byId('guest-name'), email: byId('guest-email'), adults: byId('adults'), children: byId('children') };
    const endpointReady = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(config.rsvpEndpoint);
    const formLinkReady = /^https:\/\/(forms\.gle\/|docs\.google\.com\/forms\/)/.test(config.googleFormUrl);
    let inFlight = false, serverClosed = false, attempt = null;

    function updateSteps() {
      form.querySelectorAll('[data-step]').forEach((button) => {
        const input = byId(button.dataset.for), value = Number(input.value);
        button.disabled = inFlight || (Number(button.dataset.step) < 0 ? value <= Number(input.min) : value >= Number(input.max));
      });
    }
    function availabilityChanged() {
      if (!byId('rsvp-success').hidden) { availability.hidden = true; submit.disabled = true; return; }
      const open = !serverClosed && core.rsvpIsOpen(config.rsvpDeadline);
      const current = Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
      const canSend = !serverClosed && core.canSubmitRsvp(config.rsvpDeadline, current, attempt);
      submit.disabled = inFlight || !canSend || !endpointReady;
      if (!open) {
        availability.textContent = canSend
          ? 'Our RSVP date has passed. You can still retry your unchanged details to check their confirmation.'
          : 'Our RSVP date has passed. Thank you for all the love!';
        availability.hidden = false;
        byId('google-form-link').hidden = true;
      } else if (!endpointReady && formLinkReady) {
        form.hidden = true; availability.hidden = true;
        byId('google-form-link').href = config.googleFormUrl;
        byId('google-form-link').hidden = false;
      } else availability.hidden = endpointReady;
    }
    function showErrors(errors) {
      Object.entries(fields).forEach(([key, input]) => {
        byId(key + '-error').textContent = errors[key] || '';
        if (errors[key]) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      });
    }
    form.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
      const input = byId(button.dataset.for);
      const next = Number(input.value || input.min) + Number(button.dataset.step);
      input.value = String(Math.max(Number(input.min), Math.min(Number(input.max), next)));
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }));
    form.addEventListener('input', (event) => {
      if (event.target.name in fields) {
        byId(event.target.name + '-error').textContent = '';
        event.target.removeAttribute('aria-invalid');
      }
      updateSteps();
      availabilityChanged();
    });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (inFlight || !endpointReady) return;
      availabilityChanged();
      if (submit.disabled) return;
      const values = Object.fromEntries(new FormData(form));
      const checked = core.validateRsvp(values);
      showErrors(checked.errors);
      status.textContent = '';
      if (!checked.valid) {
        fields[Object.keys(checked.errors)[0]].focus();
        return;
      }
      const fingerprint = JSON.stringify(checked.value);
      if (!attempt || attempt.fingerprint !== fingerprint) {
        const requestId = window.crypto && crypto.randomUUID ? crypto.randomUUID() :
          'rsvp-' + Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
        attempt = { requestId, fingerprint };
      }
      inFlight = true;
      form.querySelectorAll('input, button').forEach((el) => { el.disabled = true; });
      submit.setAttribute('aria-busy', 'true');
      submit.querySelector('span').textContent = 'Sending with love…';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      try {
        const response = await fetch(config.rsvpEndpoint, {
          method: 'POST', credentials: 'omit', redirect: 'follow', signal: controller.signal,
          body: new URLSearchParams({ ...checked.value, requestId: attempt.requestId, company: values.company || '' })
        });
        if (!response.ok) throw new Error('network');
        const result = await response.json();
        if (result.ok === true && result.requestId === attempt.requestId) {
          const total = checked.value.adults + checked.value.children;
          byId('rsvp-receipt').textContent = `${checked.value.adults} ${checked.value.adults === 1 ? 'adult' : 'adults'} · ${checked.value.children} ${checked.value.children === 1 ? 'child' : 'children'} · ${total} ${total === 1 ? 'guest' : 'guests'} in all`;
          form.hidden = true; availability.hidden = true;
          byId('rsvp-success').hidden = false;
          byId('rsvp-success').focus({ preventScroll: true });
        } else {
          const messages = {
            validation: 'Please check the details below and try again.',
            closed: 'Our RSVP date has passed. Thank you for all the love!',
            busy: 'Our guest list is busy just now. Please try again in a moment.',
            rate_limit: 'We’ve received a few responses from this email. Please wait a moment and try again.',
            unavailable: 'We couldn’t save your RSVP just now. Please try again in a moment.'
          };
          if (result.code === 'validation') showErrors(result.errors || {});
          if (result.code === 'closed') serverClosed = true;
          if (!messages[result.code]) throw new Error('unconfirmed');
          status.textContent = messages[result.code];
          status.focus({ preventScroll: true });
        }
      } catch (_) {
        status.textContent = 'We couldn’t confirm your RSVP. Please check your connection and try again. A retry with the same details won’t be counted twice.';
        status.focus({ preventScroll: true });
      } finally {
        clearTimeout(timeout); inFlight = false;
        form.querySelectorAll('input, button').forEach((el) => { el.disabled = false; });
        submit.removeAttribute('aria-busy'); submit.querySelector('span').textContent = 'Send RSVP';
        updateSteps(); availabilityChanged();
        if (form.hidden && !byId('rsvp-success').hidden) availability.hidden = true;
      }
    });
    updateSteps(); availabilityChanged();
    setInterval(availabilityChanged, 60000);
  }

  initCountdown();
  initScratch();
  initMap();
  initRsvp();
  initMotion();
}());
