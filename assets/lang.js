// Zweisprachige Rahmenseiten (de/en).
// Inhalte stehen doppelt im HTML, markiert mit data-l="de" bzw. data-l="en";
// site.css blendet je nach <html data-lang> die andere Sprache aus.
// Reihenfolge: URL ?lang= → gespeicherte Wahl → Browsersprache (wie figround).
// Wird synchron im <head> geladen, damit die Seite nicht kurz falsch aufblitzt.
(function () {
  var KEY = 'hermesj-lang';
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function store(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* privater Modus */ }
  }
  function valid(lang) { return lang === 'de' || lang === 'en'; }

  function detect() {
    var url = new URLSearchParams(location.search).get('lang');
    if (valid(url)) { store(url); return url; }
    var saved = stored();
    if (valid(saved)) return saved;
    var prefs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < prefs.length; i++) {
      var p = (prefs[i] || '').toLowerCase();
      if (p.indexOf('de') === 0) return 'de';
      if (p.indexOf('en') === 0) return 'en';
    }
    return 'en';
  }

  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    var t = document.querySelector('title');
    if (t && t.getAttribute('data-' + lang)) document.title = t.getAttribute('data-' + lang);
    var buttons = document.querySelectorAll('.lang-switch button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].value === lang ? 'true' : 'false');
    }
    var imgs = document.querySelectorAll('[data-alt-' + lang + ']');
    for (var j = 0; j < imgs.length; j++) {
      imgs[j].alt = imgs[j].getAttribute('data-alt-' + lang);
    }
  }

  apply(detect());

  document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-lang'));
    var buttons = document.querySelectorAll('.lang-switch button');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function () {
        store(this.value);
        apply(this.value);
      });
    }
  });
})();
