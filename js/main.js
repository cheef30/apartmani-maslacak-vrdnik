(() => {
  'use strict';
  const WA = 'https://wa.me/381669241234';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- semenke maslačka krenu tek kad se strana učita ---------- */
  if (!reduce) {
    const go = () => setTimeout(() => { const d = document.querySelector('.dandelion'); if (d) d.classList.add('go'); }, 500);
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  }

  /* ---------- meni na telefonu ---------- */
  const menuBtn = $('.top__menu');
  const nav = $('#nav');
  if (menuBtn && nav) {
    const close = () => { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { close(); menuBtn.focus(); } });
  }

  /* ---------- upit za termin ---------- */
  const form = $('#askForm');
  if (form) {
    const fin = $('#f-in'), fout = $('#f-out'), fg = $('#f-g'), note = $('#askNote');
    const defaultNote = note.textContent;
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const today = new Date();
    fin.min = iso(today);
    fout.min = iso(new Date(today.getTime() + 864e5));
    const fmt = (v) => { const [y, m, d] = v.split('-'); return `${d}.${m}.${y}.`; };

    fin.addEventListener('change', () => {
      if (!fin.value) return;
      const next = new Date(fin.value + 'T12:00:00');
      next.setDate(next.getDate() + 1);
      fout.min = iso(next);
      if (!fout.value || fout.value <= fin.value) fout.value = iso(next);
      fin.removeAttribute('aria-invalid');
      fout.removeAttribute('aria-invalid');
    });
    fout.addEventListener('change', () => fout.removeAttribute('aria-invalid'));

    const fail = (msg, el) => {
      note.textContent = msg;
      note.classList.add('err');
      el.setAttribute('aria-invalid', 'true');
      el.focus();
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      note.classList.remove('err');
      note.textContent = defaultNote;
      if (!fin.value) return fail('Izaberite datum dolaska.', fin);
      if (!fout.value) return fail('Izaberite datum odlaska.', fout);
      if (fout.value <= fin.value) return fail('Datum odlaska treba da bude posle datuma dolaska.', fout);
      const g = fg.value;
      const osoba = g === '1' ? 'osobu' : (['2', '3', '4'].includes(g) ? 'osobe' : 'osoba');
      const text = `Dobar dan, zanima me smeštaj od ${fmt(fin.value)} do ${fmt(fout.value)} za ${g} ${osoba}.`;
      const url = `${WA}?text=${encodeURIComponent(text)}`;
      const a = document.createElement('a');
      a.href = url; a.target = '_blank'; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      note.textContent = 'Poruka je spremna u WhatsApp-u. Ako se nije otvorio, pozovite 066 924 1234.';
    });
  }

  /* ---------- klizači fotografija u apartmanima ---------- */
  $$('.apt__media').forEach((media) => {
    const track = $('[data-slider]', media);
    const count = $('.slider__count b', media);
    const slides = $$('.slide', track);
    const go = (dir) => {
      const i = Math.round(track.scrollLeft / track.clientWidth) + dir;
      const n = (i + slides.length) % slides.length;
      track.scrollTo({ left: n * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    };
    $('[data-prev]', media).addEventListener('click', () => go(-1));
    $('[data-next]', media).addEventListener('click', () => go(1));
    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { count.textContent = String(Math.round(track.scrollLeft / track.clientWidth) + 1); });
    }, { passive: true });
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });
  });

  /* ---------- lightbox ---------- */
  const lb = $('#lb');
  // skupovi fotografija se čitaju iz same strane (data-full na svakoj slici)
  const data = {};
  $$('[data-lb]').forEach((btn) => {
    const im = $('img', btn);
    if (!im) return;
    const g = btn.dataset.lb;
    (data[g] = data[g] || [])[Number(btn.dataset.i) || 0] = [im.dataset.full, im.alt, Number(im.dataset.fw), Number(im.dataset.fh)];
  });
  if (lb && typeof lb.showModal === 'function') {
    const im = $('#lbImg'), cap = $('#lbCap'), num = $('#lbN');
    let set = [], idx = 0, opener = null;

    const show = (i) => {
      idx = (i + set.length) % set.length;
      const [src, alt, w, h] = set[idx];
      im.classList.add('loading');
      im.onload = () => im.classList.remove('loading');
      im.width = w; im.height = h;
      im.src = src; im.alt = alt;
      cap.textContent = alt;
      num.textContent = `${idx + 1} / ${set.length}`;
      // učitaj sledeću unapred
      const nx = set[(idx + 1) % set.length];
      if (nx) { const p = new Image(); p.src = nx[0]; }
    };
    const open = (group, i, btn) => {
      set = data[group] || [];
      if (!set.length) return;
      opener = btn;
      show(i);
      lb.showModal();
      document.documentElement.style.overflow = 'hidden';
    };
    const close = () => lb.close();
    lb.addEventListener('close', () => {
      document.documentElement.style.overflow = '';
      if (opener) opener.focus();
    });

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lb]');
      if (!b) return;
      e.preventDefault();
      open(b.dataset.lb, Number(b.dataset.i) || 0, b);
    });
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', () => show(idx - 1));
    $('#lbNext').addEventListener('click', () => show(idx + 1));
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
    // klik na tamnu pozadinu zatvara
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lb__stage')) close(); });

    // prevlačenje prstom
    let x0 = null, y0 = null;
    const stage = $('.lb__stage', lb);
    stage.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
      x0 = y0 = null;
    }, { passive: true });
  }

  /* ---------- 3D tura (učitava se tek na dodir) ---------- */
  const tourBtn = $('#tourBtn');
  if (tourBtn) {
    tourBtn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = 'https://realsee.ai/a9rrxZr8';
      f.title = '3D šetnja kroz dvorište Apartmana Maslačak';
      f.allow = 'fullscreen; xr-spatial-tracking; gyroscope; accelerometer';
      f.allowFullscreen = true;
      tourBtn.replaceWith(f);
      f.focus();
    });
  }

  /* ---------- plutajući kontakt na telefonu ---------- */
  const dock = $('#dock');
  const heroCta = $('.hero__cta');
  const contact = $('#kontakt');
  if (dock && heroCta && 'IntersectionObserver' in window) {
    let pastHero = false, atContact = false;
    const upd = () => dock.classList.toggle('show', pastHero && !atContact);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; upd(); }).observe(heroCta);
    if (contact) new IntersectionObserver(([e]) => { atContact = e.isIntersecting; upd(); }, { threshold: .25 }).observe(contact);
  }

  /* ---------- blago pojavljivanje na skrol ----------
     posmatraju se cele sekcije, ne pojedinačni elementi, da se ne bi
     prisilno računao raspored sekcija koje su još van ekrana */
  const groups = $$('main > section').filter((sec) => sec.querySelector('.reveal'));
  const showAll = (sec) => $$('.reveal', sec).forEach((el) => el.classList.add('in'));
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { showAll(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    groups.forEach((sec) => io.observe(sec));
  } else {
    groups.forEach(showAll);
  }
})();
