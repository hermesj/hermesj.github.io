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
  },

  // ── Inject the shared header / footer / explanation ──
  // Call once per page (synchronously, before FIGROUND.ready resolves)
  // so the IDs btnDe/btnEn/btnAlignH/btnAlignV/swapBtn exist by the time
  // each view's switchLang/switchAlign functions look for them.
  //
  // config:
  //   showSwap:       boolean — adds the Swap button
  //   swapHandler:    string  — name of the global swap function to call
  //                              (default 'swap'; Palimpsest uses 'swapLayers')
  //   showAlignment:  boolean — adds the Horizontal/Vertical toggle
  //   explanation:    { en: '...', de: '...' } — view explanation text
  //   extraLinks:     [{ href, en, de }] — extra links for the header
  //                                         (e.g. Audio's "Advanced Mode")
  //
  // Returns { header, footer, explanation } DOM references.
  injectHeader: function (config) {
    config = config || {};
    var showSwap = !!config.showSwap;
    var showAlignment = !!config.showAlignment;
    var swapHandler = config.swapHandler || 'swap';

    var html = [
      '<span class="hdr-group">',
        '<a id="btnDe" onclick="switchLang(\'de\')">Deutsch</a>',
        '<a id="btnEn" class="active" onclick="switchLang(\'en\')">English</a>',
      '</span>',
      '<span class="hdr-group">',
        '<a class="hdr-main-page" href="index.html" data-en="Main Page" data-de="Hauptseite">Main Page</a>',
      '</span>'
    ];

    // Help button — only present if the view supplies an explanation.
    // Sits right after Main Page; clicking toggles a fixed overlay.
    if (config.explanation) {
      html.push(
        '<span class="hdr-group">',
          '<a id="helpBtn" role="button" tabindex="0" data-en="Help" data-de="Hilfe">Help</a>',
        '</span>'
      );
    }

    if (showSwap) {
      html.push(
        '<span class="hdr-group">',
          '<button id="swapBtn" type="button" onclick="' + swapHandler + '()" data-en="\u21C5 Swap" data-de="\u21C5 Tauschen">\u21C5 Swap</button>',
        '</span>'
      );
    }

    if (showAlignment) {
      html.push(
        '<span class="hdr-group hdr-align">',
          '<span class="hdr-align-label" data-en="Alignment:" data-de="Ausrichtung:">Alignment:</span>',
          '<a id="btnAlignH" class="active" onclick="switchAlign(\'horizontal\')" data-en="Horizontal" data-de="Horizontal">Horizontal</a>',
          '<a id="btnAlignV" onclick="switchAlign(\'vertical\')" data-en="Vertical" data-de="Vertikal">Vertical</a>',
        '</span>'
      );
    }

    if (config.extraLinks && config.extraLinks.length) {
      config.extraLinks.forEach(function (link) {
        html.push(
          '<span class="hdr-group">',
            '<a href="' + link.href + '" data-en="' + (link.en || '') +
              '" data-de="' + (link.de || link.en || '') + '">' +
              (link.en || link.de || '') +
            '</a>',
          '</span>'
        );
      });
    }

    var header = document.createElement('div');
    header.className = 'shared-bar shared-header';
    header.innerHTML = html.join('');
    document.body.insertBefore(header, document.body.firstChild);

    // Footer — same shape as header but only Main Page (per user spec).
    var footer = document.createElement('div');
    footer.className = 'shared-bar shared-footer';
    footer.innerHTML =
      '<span class="hdr-group">' +
        '<a href="index.html" data-en="Main Page" data-de="Hauptseite">Main Page</a>' +
      '</span>';
    document.body.appendChild(footer);

    // Explanation — built as a hidden fixed overlay (centered).
    // The Help button toggles `.visible`; the next click / touch /
    // keypress / wheel anywhere dismisses it. The data-en / data-de
    // attributes let each view's switchLang loop localize it.
    var explainEl = null;
    if (config.explanation) {
      explainEl = document.createElement('div');
      explainEl.id = 'sharedExplanation';
      explainEl.className = 'shared-explanation';
      explainEl.setAttribute('data-en', config.explanation.en || '');
      explainEl.setAttribute('data-de', config.explanation.de || '');
      explainEl.textContent = config.explanation.en || '';
      // Append to body so it's positioned relative to the viewport
      // and stacks above all view content (z-index in CSS).
      document.body.appendChild(explainEl);

      var helpBtn = header.querySelector('#helpBtn');
      if (helpBtn) {
        helpBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          // Click-Help-while-shown also closes (toggle behaviour).
          if (explainEl.classList.contains('visible')) {
            explainEl.classList.remove('visible');
            return;
          }
          explainEl.classList.add('visible');
          // Defer attaching dismiss listeners by a tick so the click
          // that just opened the overlay can't immediately close it
          // as it bubbles up to window.
          setTimeout(function () {
            var dismiss = function (ev) {
              // Ignore events originating on the Help button itself —
              // a second click on Help is handled by the toggle above,
              // and a keydown while Help still has focus shouldn't
              // race with this listener.
              if (ev && ev.target &&
                  (ev.target === helpBtn || helpBtn.contains(ev.target))) {
                return;
              }
              explainEl.classList.remove('visible');
              window.removeEventListener('click', dismiss, true);
              window.removeEventListener('touchstart', dismiss, true);
              window.removeEventListener('keydown', dismiss, true);
              window.removeEventListener('wheel', dismiss, true);
            };
            // Capture phase so we beat any view-level handler that
            // calls stopPropagation on its own controls.
            window.addEventListener('click', dismiss, true);
            window.addEventListener('touchstart', dismiss, true);
            window.addEventListener('keydown', dismiss, true);
            window.addEventListener('wheel', dismiss, true);
          }, 50);
        });
      }
    }

    return { header: header, footer: footer, explanation: explainEl };
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
