/**
 * Client-side scripts for docs pages, injected as inline <script> tags.
 * Pattern matches existing PostHog inline script in render.tsx.
 * No build step, no Preact hydration — vanilla JS enhancing SSR'd HTML.
 */

/**
 * Sidebar scroll highlighting via IntersectionObserver.
 * Highlights the heading in "On this page" that's currently visible.
 */
export const scrollHighlightScript = `
<script>
(function() {
  var links = document.querySelectorAll('nav[aria-label="On this page"] a');
  if (!links.length) return;
  var headings = [];
  links.forEach(function(link) {
    var id = link.getAttribute('href').slice(1);
    var el = document.getElementById(id);
    if (el) headings.push({ el: el, link: link });
  });
  if (!headings.length) return;
  var current = null;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        if (current) current.classList.remove('text-ink', 'font-medium');
        var match = headings.find(function(h) { return h.el === entry.target; });
        if (match) {
          match.link.classList.add('text-ink', 'font-medium');
          current = match.link;
        }
      }
    });
  }, { rootMargin: '-80px 0px -80% 0px', threshold: 0 });
  headings.forEach(function(h) { observer.observe(h.el); });
})();
</script>`

/**
 * Copy code block button.
 * Injects a "Copy" button into every <pre> inside .prose-warm.
 */
export const copyCodeScript = `
<script>
(function() {
  document.querySelectorAll('.prose-warm pre').forEach(function(pre) {
    var btn = document.createElement('button');
    btn.textContent = 'Copy';
    btn.setAttribute('type', 'button');
    btn.style.cssText = 'position:absolute;top:8px;right:8px;padding:2px 8px;font-size:12px;background:rgba(255,255,255,0.15);color:#faf8f5;border:1px solid rgba(255,255,255,0.2);border-radius:4px;cursor:pointer;';
    btn.addEventListener('click', function() {
      var code = pre.querySelector('code');
      var text = code ? code.textContent : pre.textContent;
      navigator.clipboard.writeText(text).then(function() {
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
      }).catch(function() {
        btn.textContent = 'Failed';
        setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
      });
    });
    pre.style.position = 'relative';
    pre.appendChild(btn);
  });
})();
</script>`

/**
 * Keyboard navigation.
 * Cmd+K / Ctrl+K focuses search input.
 * j/k navigates prev/next page (disabled in input/textarea).
 */
export const keyboardNavScript = `
<script>
(function() {
  document.addEventListener('keydown', function(e) {
    var tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      var searchInput = document.querySelector('[data-docs-search]');
      if (searchInput) searchInput.focus();
      return;
    }
    if (e.key === 'j') {
      var next = document.querySelector('nav[aria-label="Page navigation"] a:last-child');
      if (next && next.getAttribute('href')) window.location.href = next.getAttribute('href');
    }
    if (e.key === 'k') {
      var prev = document.querySelector('nav[aria-label="Page navigation"] a:first-child');
      if (prev && prev.getAttribute('href')) window.location.href = prev.getAttribute('href');
    }
  });
})();
</script>`

/**
 * Page feedback (thumbs up/down).
 * Sends PostHog event. Deduped via localStorage.
 */
export const feedbackScript = `
<script>
(function() {
  var container = document.querySelector('[data-page-feedback]');
  if (!container) return;
  var path = window.location.pathname;
  var key = 'feedback:' + path;
  if (localStorage.getItem(key)) {
    container.innerHTML = '<span class="text-sm text-muted">Thanks for your feedback!</span>';
    return;
  }
  container.innerHTML = '<span class="text-sm text-muted">Was this helpful?</span> <button type="button" data-sentiment="up" class="cursor-pointer border-none bg-transparent text-lg p-xs">\\u{1F44D}</button> <button type="button" data-sentiment="down" class="cursor-pointer border-none bg-transparent text-lg p-xs">\\u{1F44E}</button>';
  container.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-sentiment]');
    if (!btn) return;
    var sentiment = btn.getAttribute('data-sentiment');
    localStorage.setItem(key, sentiment);
    container.innerHTML = '<span class="text-sm text-muted">Thanks for your feedback!</span>';
    if (typeof posthog !== 'undefined') {
      posthog.capture('page_feedback', { path: path, sentiment: sentiment, content_type: container.getAttribute('data-content-type') || '' });
    }
  });
})();
</script>`

/**
 * Share button.
 * Uses navigator.share on supported platforms, clipboard fallback elsewhere.
 */
export const shareScript = `
<script>
(function() {
  var btn = document.querySelector('[data-share-button]');
  if (!btn) return;
  btn.addEventListener('click', function() {
    var title = document.title;
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: title, url: url }).catch(function() {});
    } else {
      navigator.clipboard.writeText(title + ' ' + url).then(function() {
        var orig = btn.textContent;
        btn.textContent = 'Link copied!';
        setTimeout(function() { btn.textContent = orig; }, 2000);
      }).catch(function() {});
    }
  });
})();
</script>`

/**
 * Fuse.js search.
 * Loads search-index.json, creates Fuse instance, renders dropdown.
 */
export const searchScript = `
<script>
(function() {
  var searchContainer = document.querySelector('[data-docs-search-container]');
  if (!searchContainer) return;
  var input = searchContainer.querySelector('[data-docs-search]');
  var dropdown = searchContainer.querySelector('[data-docs-search-results]');
  if (!input || !dropdown) return;
  var fuse = null;
  var loaded = false;
  var TYPE_LABELS = { handbook: 'Handbook', blog: 'Blog', method: 'Method', guides: 'Guide', help: 'Help', changelog: 'Changelog' };

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function loadIndex() {
    if (loaded) return;
    loaded = true;
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js';
    script.onload = function() {
      fetch('/search-index.json').then(function(r) { return r.json(); }).then(function(data) {
        fuse = new Fuse(data, { keys: ['title', 'description', 'body'], threshold: 0.3, limit: 8 });
      }).catch(function() {
        dropdown.innerHTML = '<div class="docs-search-empty">Search unavailable</div>';
      });
    };
    document.head.appendChild(script);
  }

  input.addEventListener('focus', loadIndex);

  input.addEventListener('input', function() {
    var q = input.value.trim();
    if (q.length < 2 || !fuse) { dropdown.style.display = 'none'; return; }
    var results = fuse.search(q);
    if (!results.length) {
      dropdown.innerHTML = '<div class="docs-search-empty">No results for \\u201C' + esc(q) + '\\u201D</div>';
      dropdown.style.display = 'block';
      if (typeof posthog !== 'undefined') posthog.capture('docs_search', { query: q, results_count: 0 });
      return;
    }
    dropdown.innerHTML = results.map(function(r) {
      var item = r.item;
      var badge = TYPE_LABELS[item.type] || esc(item.type);
      var snippet = esc((item.description || item.body || '').slice(0, 80));
      return '<a href="' + esc(item.url) + '" class="docs-search-result">' +
        '<div style="display:flex;align-items:center;gap:8px;"><span class="docs-search-result-title">' + esc(item.title) + '</span>' +
        '<span class="docs-search-result-badge">' + badge + '</span></div>' +
        '<div class="docs-search-result-snippet">' + snippet + '</div></a>';
    }).join('');
    dropdown.style.display = 'block';
    if (typeof posthog !== 'undefined') posthog.capture('docs_search', { query: q, results_count: results.length });
  });

  input.addEventListener('blur', function() { setTimeout(function() { dropdown.style.display = 'none'; }, 200); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { dropdown.style.display = 'none'; input.blur(); } });
})();
</script>`

/**
 * Mobile bottom sheet navigation.
 * Toggle open/close, backdrop click to dismiss, Escape to close.
 */
export const mobileNavScript = `
<script>
(function() {
  var trigger = document.querySelector('[data-mobile-nav-trigger]');
  var sheet = document.querySelector('[data-mobile-nav-sheet]');
  var backdrop = document.querySelector('[data-mobile-nav-backdrop]');
  if (!trigger || !sheet) return;
  function open() { sheet.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  function close() { sheet.classList.add('hidden'); document.body.style.overflow = ''; }
  trigger.addEventListener('click', open);
  if (backdrop) backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') close(); });
  sheet.querySelectorAll('a').forEach(function(a) { a.addEventListener('click', close); });
})();
</script>`

/**
 * Keyboard shortcut hint.
 * Shows "Press j/k to navigate, Cmd+K to search" for 5 seconds on first visit.
 */
export const keyboardHintScript = `
<script>
(function() {
  if (localStorage.getItem('docs-kb-hint-seen')) return;
  var hint = document.createElement('div');
  hint.className = 'hidden md:block';
  hint.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:var(--color-ink);color:var(--color-cream);padding:6px 16px;border-radius:8px;font-size:13px;z-index:30;opacity:0.9;transition:opacity 300ms;';
  hint.textContent = 'Press j/k to navigate \\u00B7 Cmd+K to search';
  document.body.appendChild(hint);
  localStorage.setItem('docs-kb-hint-seen', '1');
  setTimeout(function() { hint.style.opacity = '0'; setTimeout(function() { hint.remove(); }, 300); }, 5000);
})();
</script>`

/** All docs scripts combined */
export function getDocsScripts(): string {
  return [
    scrollHighlightScript,
    copyCodeScript,
    keyboardNavScript,
    feedbackScript,
    shareScript,
    searchScript,
    mobileNavScript,
    keyboardHintScript,
  ].join('\n')
}
