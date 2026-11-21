(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hero title: split into letters for the 3D rise
  $$('[data-split]').forEach(el => {
    el.innerHTML = [...el.dataset.split].map((c, i) => `<span class="ch" style="--i:${i}" aria-hidden="true">${c}</span>`).join('');
  });

  // Stagger reveals inside each section
  $$('section, header').forEach(sec => {
    $$('.rv', sec).forEach((el, i) => el.style.setProperty('--d', (i * 0.11).toFixed(2) + 's'));
  });

  // Typewriter for the question and the closing quote
  const type = el => {
    const text = el.dataset.text;
    if (calm) { el.textContent = text; return; }
    let i = 0;
    el.classList.add('caret');
    const tick = () => {
      el.firstChild ? (el.firstChild.nodeValue = text.slice(0, ++i)) : el.append(text.slice(0, ++i));
      if (i < text.length) setTimeout(tick, 28);
      else setTimeout(() => el.classList.remove('caret'), 2500);
    };
    tick();
  };

  // Count-up numbers
  const count = el => {
    const end = +el.dataset.count;
    if (calm) { el.textContent = end; return; }
    const t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / 1600, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    el.classList.add('in');
    if (el.matches('.type')) type(el);
    $$('[data-count]', el).forEach(count);
    io.unobserve(el);
  }), { threshold: 0.25 });
  $$('.rv, .split, .type, h2').forEach(el => io.observe(el));

  // Side navigation dots
  const secs = $$('section, header');
  const dots = $('#dots');
  secs.forEach(s => {
    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.dataset.t = s.dataset.title || s.id;
    a.setAttribute('aria-label', a.dataset.t);
    dots.append(a);
  });
  const dotEls = $$('a', dots);
  const so = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) dotEls.forEach((d, i) => d.classList.toggle('on', secs[i] === e.target));
  }), { threshold: 0.55 });
  secs.forEach(s => so.observe(s));

  // Scroll progress, parallax, cursor glow, panel tilt
  const bar = $('#bar'), glow = $('#glow');
  const par = $$('[data-par]');
  let ticking = false;
  const frame = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (calm) return;
    par.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const y = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.par);
      el.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  addEventListener('resize', frame);
  frame();

  addEventListener('pointermove', e => {
    glow.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
    if (calm) return;
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    $$('.pimg').forEach(img => {
      img.style.setProperty('--ry', (-nx * 10).toFixed(2) + 'deg');
      img.style.setProperty('--rx', (ny * 8).toFixed(2) + 'deg');
    });
    const hb = $('.hero .bg');
    if (hb) hb.style.translate = `${(-nx * 24).toFixed(1)}px ${(-ny * 14).toFixed(1)}px`;
  }, { passive: true });

  // Challenge: choose an approach
  const say = {
    A: 'Gestures and symbols are a good start. Louise began with simple signs, but she knew a sign can mean different things.',
    B: 'Observation comes first. Watching patterns means you learn before you assume.',
    C: 'A shared system of symbols is where it ends up. You can only build it after you have observed and tested.'
  };
  const expl = $('#expl');
  $$('.opt').forEach(b => b.addEventListener('click', () => {
    $$('.opt').forEach(o => o.classList.toggle('on', o === b));
    expl.classList.add('swap');
    setTimeout(() => {
      expl.textContent = say[b.dataset.k] + ' The best answer combines all three: observe, be patient, experiment and work together.';
      expl.classList.remove('swap');
    }, 300);
  }));

  // Keyboard: arrows and page keys jump between sections
  addEventListener('keydown', e => {
    if (!$('#veil').hidden || e.target.isContentEditable || e.altKey || e.ctrlKey || e.metaKey) return;
    const next = ['ArrowDown', 'PageDown'].includes(e.key) ? 1 : ['ArrowUp', 'PageUp'].includes(e.key) ? -1 : 0;
    if (!next) return;
    e.preventDefault();
    const i = secs.findIndex(s => s.getBoundingClientRect().top > -innerHeight / 2);
    const cur = i < 0 ? secs.length - 1 : i;
    const target = secs[Math.max(0, Math.min(secs.length - 1, cur + next))];
    target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' });
  });

  // Any Question: fun overlay
  const veil = $('#veil'), ask = $('#ask'), vclose = $('#vclose');
  const openVeil = () => {
    veil.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.add('open')));
    vclose.focus({ preventScroll: true });
  };
  const closeVeil = () => {
    veil.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { veil.hidden = true; }, calm ? 0 : 600);
    ask.focus({ preventScroll: true });
  };
  ask.addEventListener('click', openVeil);
  vclose.addEventListener('click', closeVeil);
  veil.addEventListener('click', e => { if (e.target === veil) closeVeil(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !veil.hidden) closeVeil(); });
})();
