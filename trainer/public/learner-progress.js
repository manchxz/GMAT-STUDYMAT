(function () {
  'use strict';

  function canonChapterId() {
    var chapter = document.body && document.body.getAttribute('data-chapter');
    if (!chapter || chapter === 'index') return null;
    if (chapter === 'diagnostic') return null;
    if (chapter.indexOf('appendix') === 0) return 'appendix';
    var m = /^(\d+)/.exec(chapter);
    if (!m) return null;
    var n = parseInt(m[1], 10);
    if (n < 1 || n > 10) return null;
    return String(n).padStart(2, '0');
  }

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        e.setAttribute(k, attrs[k]);
      });
    }
    if (html) e.innerHTML = html;
    return e;
  }

  async function fetchMe() {
    try {
      var r = await fetch('/api/auth/me', { credentials: 'include' });
      if (!r.ok) return null;
      var j = await r.json();
      return j.user || null;
    } catch (_) {
      return null;
    }
  }

  async function markComplete(chId) {
    try {
      var r = await fetch('/api/progress/chapter', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: chId }),
      });
      return r.ok;
    } catch (_) {
      return false;
    }
  }

  var chId = canonChapterId();
  var bar = el('div', {
    id: 'lfg-learner-bar',
    style:
      'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:.65rem 1rem;font:14px system-ui,sans-serif;background:rgba(20,20,22,.92);color:#eee;border-top:1px solid #333;display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;justify-content:center;',
  });

  fetchMe().then(function (user) {
    if (user) {
      bar.appendChild(
        el('span', {}, 'Signed in as <strong>' + (user.name || user.email) + '</strong>')
      );
      var dash = el('a', { href: '/dashboard' });
      dash.textContent = 'Dashboard';
      dash.style.cssText = 'color:#2dd4bf;font-weight:600;margin-right:.5rem;';
      bar.appendChild(dash);
      if (chId) {
        var btn = el('button', { type: 'button' });
        btn.textContent = 'Mark this chapter complete';
        btn.style.cssText =
          'background:#2dd4bf;color:#111;border:none;padding:.4rem .9rem;font-weight:700;cursor:pointer;border-radius:6px;';
        btn.addEventListener('click', function () {
          btn.disabled = true;
          markComplete(chId).then(function (ok) {
            btn.textContent = ok ? 'Saved ✓' : 'Could not save';
          });
        });
        bar.appendChild(btn);
      }
    } else {
      bar.appendChild(el('span', {}, 'Track progress on your diagnostic and chapters — '));
      var reg = el('a', { href: '/register' });
      reg.textContent = 'Register';
      reg.style.cssText = 'color:#2dd4bf;font-weight:600;';
      bar.appendChild(reg);
      bar.appendChild(document.createTextNode(' · '));
      var log = el('a', { href: '/login' });
      log.textContent = 'Sign in';
      log.style.cssText = 'color:#2dd4bf;font-weight:600;';
      bar.appendChild(log);
    }
    document.body.appendChild(bar);
  });
})();
