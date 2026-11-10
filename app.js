/* CLASSIC PICTURES STUDIOS — shared behaviour. Vanilla JS, no libraries. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '254720215974';
  var MAIL = '';

  /* ---------- Splash ---------- */
  var splash = document.getElementById('splash');
  if (splash) {
    var hide = function () {
      setTimeout(function () { splash.classList.add('gone'); }, reduced ? 0 : 700);
    };
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide);
    setTimeout(hide, 2800);
  }

  /* ---------- Smart sticky header ----------
     Hides on the way down, comes straight back on any upward scroll — from
     anywhere on the page, not only once you're back near the top. */
  var hdr = document.querySelector('.hdr');
  if (hdr) {
    var last = window.pageYOffset, ticking = false;
    var onScroll = function () {
      var y = window.pageYOffset;
      if (y > last && y > 240) hdr.classList.add('up');
      else hdr.classList.remove('up');
      last = y;
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
    }, { passive: true });
  }

  /* ---------- Mobile nav ---------- */
  var burger = document.querySelector('.burger'), nav = document.querySelector('.nav');
  if (burger && nav) {
    var closeNav = function () {
      nav.classList.remove('open'); burger.classList.remove('x');
      burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    };
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.classList.toggle('x', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  /* ---------- Scroll reveal ----------
     threshold 0 on purpose: the gallery grid is far taller than the viewport, so
     any ratio above zero can never be satisfied. Fire on the top edge crossing
     and hold it back a little with the bottom margin instead. */
  var rv = document.querySelectorAll('.rv,.tile,.gate');
  if (rv.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(rv, function (el) { el.classList.add('in'); });
    } else {
      var ro = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          var d = el.hasAttribute('data-stagger') ? +el.getAttribute('data-stagger') : 0;
          setTimeout(function () { el.classList.add('in'); }, d);
          ro.unobserve(el);
        });
      }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
      Array.prototype.forEach.call(rv, function (el) { ro.observe(el); });
    }
  }

  /* ---------- Reach counters ---------- */
  var nums = document.querySelectorAll('[data-count]');
  if (nums.length) {
    var paint = function (el, v) {
      var dec = +(el.getAttribute('data-dec') || 0);
      el.firstChild.nodeValue = v.toFixed(dec);
    };
    var runCount = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (reduced) { paint(el, target); return; }
      var t0 = null, dur = 1500;
      var step = function (t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        paint(el, target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(nums, runCount);
    } else {
      var co = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { runCount(e.target); co.unobserve(e.target); }
        });
      }, { threshold: .4 });
      Array.prototype.forEach.call(nums, function (el) { co.observe(el); });
    }
  }

  /* ---------- Photo lightbox ---------- */
  var lb = document.getElementById('lb');
  if (lb) {
    var tiles = Array.prototype.slice.call(document.querySelectorAll('.tile'));
    var img = lb.querySelector('.lb-stage img'),
        cap = lb.querySelector('.lb-cap'),
        counter = lb.querySelector('.lb-count'),
        idx = 0, opener = null;

    var show = function (i) {
      idx = (i + tiles.length) % tiles.length;
      var t = tiles[idx];
      img.classList.remove('ready');
      var full = t.getAttribute('data-full');
      var title = t.getAttribute('data-title') || '';
      var detail = t.getAttribute('data-detail') || '';
      var pre = new Image();
      pre.onload = function () { img.src = full; img.alt = title; img.classList.add('ready'); };
      pre.src = full;
      cap.querySelector('b').textContent = title;
      cap.querySelector('span').textContent = detail;
      counter.textContent = (idx + 1) + ' / ' + tiles.length;
    };
    var openLb = function (i, from) {
      opener = from || null;
      lb.classList.add('open'); show(i);
      requestAnimationFrame(function () { lb.classList.add('show'); });
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    };
    var closeLb = function () {
      lb.classList.remove('show');
      setTimeout(function () { lb.classList.remove('open'); img.removeAttribute('src'); }, 340);
      document.body.style.overflow = '';
      if (opener) opener.focus();
    };

    tiles.forEach(function (t, i) { t.addEventListener('click', function () { openLb(i, t); }); });
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-nav.prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-nav.next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.classList.contains('lb-stage')) closeLb();
    });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  /* ---------- Films ---------- */
  var films = Array.prototype.slice.call(document.querySelectorAll('.film'));
  if (films.length) {
    var vids = films.map(function (f) { return f.querySelector('video'); });

    /* Autoplay muted only while on screen, so a phone on mobile data is never
       decoding eleven clips at once. */
    if ('IntersectionObserver' in window) {
      var vo = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting) {
            if (v.preload === 'none') v.preload = 'metadata';
            var p = v.play();
            if (p && p.catch) p.catch(function () {});
          } else {
            v.pause();
          }
        });
      }, { threshold: .35 });
      vids.forEach(function (v) { vo.observe(v); });
    }

    /* Only one clip is ever allowed to have sound. */
    var loud = null;
    var silence = function () {
      if (!loud) return;
      loud.muted = true;
      var b = loud.closest('.film-frame').querySelector('.snd');
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Turn sound on');
      loud = null;
    };
    films.forEach(function (f) {
      var v = f.querySelector('video');
      var snd = f.querySelector('.snd');
      snd.addEventListener('click', function () {
        if (v.muted) {
          silence();
          v.muted = false;
          var p = v.play(); if (p && p.catch) p.catch(function () {});
          loud = v;
          snd.setAttribute('aria-pressed', 'true');
          snd.setAttribute('aria-label', 'Turn sound off');
        } else {
          silence();
        }
      });
    });

    /* Fullscreen player */
    var vlb = document.getElementById('vlb');
    if (vlb) {
      var stage = vlb.querySelector('video');
      var openVid = function (v) {
        silence();
        vids.forEach(function (x) { x.pause(); });
        stage.src = v.currentSrc || v.querySelector('source').src;
        stage.currentTime = 0;
        vlb.classList.add('open');
        document.body.style.overflow = 'hidden';
        var p = stage.play(); if (p && p.catch) p.catch(function () {});
        vlb.querySelector('.lb-btn').focus();
      };
      var closeVid = function () {
        stage.pause(); stage.removeAttribute('src'); stage.load();
        vlb.classList.remove('open');
        document.body.style.overflow = '';
      };
      films.forEach(function (f) {
        var v = f.querySelector('video');
        f.querySelector('.fs').addEventListener('click', function () { openVid(v); });
        v.addEventListener('click', function () { openVid(v); });
      });
      vlb.querySelector('.lb-btn').addEventListener('click', closeVid);
      vlb.addEventListener('click', function (e) { if (e.target === vlb) closeVid(); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && vlb.classList.contains('open')) closeVid();
      });
    }
  }

  /* ---------- Booking flow (the one Premium feature) ---------- */
  var bk = document.getElementById('bk');
  if (bk) {
    var panes = Array.prototype.slice.call(bk.querySelectorAll('.bk-pane'));
    var rail = Array.prototype.slice.call(bk.querySelectorAll('.bk-rail div'));
    var count = bk.querySelector('.bk-count');
    var next = bk.querySelector('.bk-next'), back = bk.querySelector('.bk-back');
    var sendRow = bk.querySelector('.bk-send');
    var step = 0;

    var data = { occasion: '', date: '', time: '', where: '', venue: '', need: '', length: '', extras: [], name: '', phone: '', notes: '' };

    /* Chip groups: single-choice ones write a string, the extras group builds a list. */
    Array.prototype.forEach.call(bk.querySelectorAll('.chips'), function (group) {
      var key = group.getAttribute('data-key');
      var multi = group.hasAttribute('data-multi');
      Array.prototype.forEach.call(group.querySelectorAll('.chip'), function (chip) {
        chip.addEventListener('click', function () {
          var val = chip.textContent.trim();
          if (multi) {
            var on = chip.getAttribute('aria-pressed') === 'true';
            chip.setAttribute('aria-pressed', on ? 'false' : 'true');
            if (on) data[key] = data[key].filter(function (x) { return x !== val; });
            else data[key] = data[key].concat([val]);
          } else {
            Array.prototype.forEach.call(group.querySelectorAll('.chip'), function (c) {
              c.setAttribute('aria-pressed', 'false');
            });
            chip.setAttribute('aria-pressed', 'true');
            data[key] = val;
          }
          clearErr(group.closest('.field') || group.parentNode);
        });
      });
    });

    Array.prototype.forEach.call(bk.querySelectorAll('input,select,textarea'), function (el) {
      el.addEventListener('input', function () {
        data[el.getAttribute('data-key')] = el.value.trim();
        clearErr(el.closest('.field'));
      });
      el.addEventListener('change', function () {
        data[el.getAttribute('data-key')] = el.value.trim();
        clearErr(el.closest('.field'));
      });
    });

    function clearErr(node) {
      if (!node) return;
      var e = node.querySelector('.err');
      if (e) e.remove();
    }
    function setErr(node, msg) {
      if (!node || node.querySelector('.err')) return;
      var s = document.createElement('span');
      s.className = 'err';
      s.textContent = msg;
      node.appendChild(s);
    }

    /* Only the fields we genuinely need to quote a job are required. */
    var rules = [
      [function () { return !!data.occasion; }, '.chips[data-key="occasion"]', 'Pick what we are covering.'],
      [function () { return !!data.date; }, '#f-date', 'A date, even a rough one, helps us check availability.'],
      [function () { return true; }, null, ''],
      [function () { return !!data.need; }, '.chips[data-key="need"]', 'Let us know if you want photos, film, or both.'],
      [function () { return !!data.name && !!data.phone; }, '#f-name', 'We need a name and a number to get back to you.']
    ];

    function validate() {
      var rule = rules[step];
      if (!rule || rule[0]()) return true;
      var target = bk.querySelector(rule[1]);
      var field = target ? (target.closest('.field') || target.parentNode) : null;
      setErr(field, rule[2]);
      if (target && target.focus) target.focus();
      return false;
    }

    function paint() {
      panes.forEach(function (p, i) { p.classList.toggle('on', i === step); });
      rail.forEach(function (r, i) {
        r.classList.toggle('done', i < step);
        r.classList.toggle('now', i === step);
      });
      count.textContent = 'Step ' + (step + 1) + ' of ' + panes.length;
      back.style.visibility = step === 0 ? 'hidden' : 'visible';
      var lastPane = step === panes.length - 1;
      next.style.display = lastPane ? 'none' : '';
      sendRow.style.display = lastPane ? 'flex' : 'none';
      if (lastPane) summarise();
    }

    function prettyDate(v) {
      if (!v) return 'Not set';
      var p = v.split('-');
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'];
      return (+p[2]) + ' ' + months[+p[1] - 1] + ' ' + p[0];
    }
    function prettyTime(v) {
      if (!v) return 'To confirm';
      var p = v.split(':'), h = +p[0];
      var ap = h >= 12 ? 'pm' : 'am';
      h = h % 12; if (h === 0) h = 12;
      return h + ':' + p[1] + ap;
    }
    function place() {
      if (!data.where) return 'To confirm';
      return data.venue ? data.venue + ', ' + data.where : data.where;
    }
    function extras() {
      return data.extras.length ? data.extras.join(', ') : 'None yet';
    }

    function summarise() {
      var set = function (k, v) {
        var el = bk.querySelector('[data-sum="' + k + '"]');
        if (el) el.textContent = v || '—';
      };
      set('occasion', data.occasion);
      set('date', prettyDate(data.date));
      set('time', prettyTime(data.time));
      set('where', place());
      set('need', data.need + (data.length ? ' · ' + data.length : ''));
      set('extras', extras());
      set('name', data.name);
      set('phone', data.phone);
      set('notes', data.notes || 'None');
    }

    function message() {
      return 'Hello Cossy Photography,\n\n' +
        'I would like to book a shoot.\n\n' +
        'Name: ' + data.name + '\n' +
        'Phone: ' + data.phone + '\n' +
        'Occasion: ' + data.occasion + '\n' +
        'Date: ' + prettyDate(data.date) + '\n' +
        'Start time: ' + prettyTime(data.time) + '\n' +
        'Location: ' + place() + '\n' +
        'Needs: ' + data.need + (data.length ? ' (' + data.length + ')' : '') + '\n' +
        'Extras: ' + extras() + '\n' +
        (data.notes ? 'Notes: ' + data.notes + '\n' : '') +
        '\nPlease confirm if you are available for this date.\n\n' +
        'Sent from the Cossy Photography website.';
    }

    next.addEventListener('click', function () {
      if (!validate()) return;
      if (step < panes.length - 1) { step++; paint(); bk.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }); }
    });
    back.addEventListener('click', function () {
      if (step > 0) { step--; paint(); bk.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }); }
    });

    var wa = bk.querySelector('.send-wa'), em = bk.querySelector('.send-mail');
    if (wa) wa.addEventListener('click', function () {
      window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(message()), '_blank', 'noopener');
    });
    if (em) em.addEventListener('click', function () {
      var subj = 'Booking request — ' + data.occasion + ' on ' + prettyDate(data.date);
      window.location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subj) +
        '&body=' + encodeURIComponent(message());
    });

    var dEl = bk.querySelector('#f-date');
    if (dEl) dEl.min = new Date().toISOString().split('T')[0];

    var wEl = bk.querySelector('#f-where');
    if (wEl) wEl.addEventListener('change', function () {
      data.where = wEl.value;
    });

    paint();
  }

  /* ---------- Year ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.yr'), function (e) {
    e.textContent = new Date().getFullYear();
  });
})();
