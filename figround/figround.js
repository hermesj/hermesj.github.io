// ══════════════════════════════════════════════════════
// Figure and Ground — shared JavaScript
// Loads texts.json and provides rendering + utility helpers.
// ══════════════════════════════════════════════════════

var FIGROUND = {
  data: null,

  // ── Detect language ──
  // Checks URL ?lang= parameter first, then browser language.
  // Returns 'de' or 'en'.
  detectLang: function () {
    var urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang === 'de' || urlLang === 'en') return urlLang;
    return (navigator.language && navigator.language.startsWith('de')) ? 'de' : 'en';
  },

  // ── Mobile detection ──
  isMobile: ('ontouchstart' in window || navigator.maxTouchPoints > 0),

  // ── Update the three-part title from texts.json ──
  // suffix: optional string appended to document.title (e.g. ' — Focus')
  updateTitle: function (lang, suffix) {
    if (!FIGROUND.data) return;
    var data = FIGROUND.data[lang];
    document.getElementById('titleLeft').textContent = data.title[0];
    document.getElementById('titleMid').textContent = data.title[1];
    document.getElementById('titleRight').textContent = data.title[2];
    document.documentElement.lang = lang;
    document.title = data.title.join(' ') + (suffix || '');
  },

  // ── Create a hint-fade function ──
  // Returns a function that fades the given element once on first call.
  createHintFader: function (hintElement) {
    var faded = false;
    return function () {
      if (!faded) {
        hintElement.classList.add('faded');
        faded = true;
      }
    };
  },

  // ── Render paragraphs to HTML ──
  renderParagraphs: function (paragraphs) {
    return paragraphs.map(function (p) {
      if (typeof p === 'object' && p.song) {
        return '<p class="song">' + p.text + '</p>';
      }
      return '<p>' + p + '</p>';
    }).join('\n\n');
  },

  // ── Build ticker string for audio prototype ──
  // Returns subtitle + paragraphs joined by ◆
  renderTicker: function (voice) {
    var parts = [voice.subtitle];
    voice.paragraphs.forEach(function (p) {
      var text = (typeof p === 'object' && p.song)
        ? '<span class="song">' + p.text + '</span>'
        : p;
      parts.push(text);
    });
    return parts.join(' \u25C6 ');
  }
};

// ── Load texts.json ──
// All pages wait for FIGROUND.ready before initialising.
FIGROUND.ready = fetch('texts.json')
  .then(function (r) { return r.json(); })
  .then(function (json) {
    FIGROUND.data = json;
    return json;
  });
