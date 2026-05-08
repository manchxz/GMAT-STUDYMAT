/* ==========================================================================
   THE LOGIC FIELD GUIDE — Interactivity
   - ELI5 / Expert tier toggles (persisted across pages via localStorage)
   - Error Log persistence per chapter
   - Active section highlighting in chapter sidebar
   ========================================================================== */

(function () {
  'use strict';

  const LS_TIER_ELI5   = 'lfg.tier.eli5';
  const LS_TIER_EXPERT = 'lfg.tier.expert';

  /* ---------- Tier toggles ---------- */
  function applyTierState() {
    const hideEli5   = localStorage.getItem(LS_TIER_ELI5)   === 'hidden';
    const hideExpert = localStorage.getItem(LS_TIER_EXPERT) === 'hidden';
    document.body.classList.toggle('hide-eli5',   hideEli5);
    document.body.classList.toggle('hide-expert', hideExpert);

    document.querySelectorAll('button[data-tier]').forEach(btn => {
      const tier = btn.dataset.tier;
      const isHidden = (tier === 'eli5' && hideEli5) || (tier === 'expert' && hideExpert);
      btn.setAttribute('aria-pressed', isHidden ? 'false' : 'true');
    });
  }

  function initTierToggles() {
    document.querySelectorAll('button[data-tier]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tier = btn.dataset.tier;
        const key = tier === 'eli5' ? LS_TIER_ELI5 : LS_TIER_EXPERT;
        const current = localStorage.getItem(key);
        localStorage.setItem(key, current === 'hidden' ? 'visible' : 'hidden');
        applyTierState();
      });
    });
    applyTierState();
  }

  /* ---------- Error log persistence ---------- */
  function chapterKey() {
    const slug = document.body.dataset.chapter || location.pathname.split('/').pop().replace('.html', '');
    return `lfg.errorlog.${slug}`;
  }

  function saveLog() {
    const log = document.querySelector('.error-log');
    if (!log) return;
    const data = {};
    log.querySelectorAll('input[name]').forEach(input => {
      data[input.name] = input.value;
    });
    localStorage.setItem(chapterKey(), JSON.stringify(data));
    showStatus('Saved locally.');
  }

  function loadLog() {
    const log = document.querySelector('.error-log');
    if (!log) return;
    const raw = localStorage.getItem(chapterKey());
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      log.querySelectorAll('input[name]').forEach(input => {
        if (data[input.name] != null) input.value = data[input.name];
      });
    } catch (_) { /* ignore corrupt JSON */ }
  }

  function clearLog() {
    if (!confirm('Clear all entries in this chapter\'s error log?')) return;
    const log = document.querySelector('.error-log');
    if (!log) return;
    log.querySelectorAll('input[name]').forEach(input => { input.value = ''; });
    localStorage.removeItem(chapterKey());
    showStatus('Cleared.');
  }

  function exportLog() {
    const log = document.querySelector('.error-log');
    if (!log) return;
    const rows = [];
    log.querySelectorAll('.log-row:not(.head)').forEach(row => {
      const values = Array.from(row.querySelectorAll('input')).map(i => i.value);
      if (values.some(v => v.trim() !== '')) rows.push(values);
    });
    if (!rows.length) { showStatus('Nothing to export.'); return; }

    const headers = ['Question', 'Mistake Type', 'Correct Approach', 'Re-test Date'];
    const csv = [headers, ...rows]
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.body.dataset.chapter || 'chapter'}-errorlog.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Exported.');
  }

  function showStatus(msg) {
    const el = document.querySelector('.log-status');
    if (!el) return;
    el.textContent = msg;
    setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 3000);
  }

  function initErrorLog() {
    const log = document.querySelector('.error-log');
    if (!log) return;
    loadLog();
    const save  = log.querySelector('[data-action="save"]');
    const clear = log.querySelector('[data-action="clear"]');
    const exp   = log.querySelector('[data-action="export"]');
    if (save)  save.addEventListener('click', saveLog);
    if (clear) clear.addEventListener('click', clearLog);
    if (exp)   exp.addEventListener('click', exportLog);

    /* autosave on blur */
    log.querySelectorAll('input[name]').forEach(input => {
      input.addEventListener('blur', saveLog);
    });
  }

  /* ---------- Sidebar active section highlighting ---------- */
  function initSidebarHighlight() {
    const links = document.querySelectorAll('.chapter-side a[href^="#"]');
    if (!links.length) return;

    const map = new Map();
    links.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) map.set(target, a);
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const link = map.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    map.forEach((_, target) => observer.observe(target));
  }

  /* ---------- Boot ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    initTierToggles();
    initErrorLog();
    initSidebarHighlight();
  }
})();
