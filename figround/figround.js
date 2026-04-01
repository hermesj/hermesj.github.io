// ══════════════════════════════════════════════════════
// Figure and Ground — shared JavaScript
// Loads texts.json and provides rendering helpers.
// ══════════════════════════════════════════════════════

var FIGROUND = {
  data: null,

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
