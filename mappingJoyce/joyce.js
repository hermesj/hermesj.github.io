/* Mapping Joyce — interactive Leaflet map of the places in James Joyce's
   Dublin fiction. Two works share one engine:

   - Dubliners: geodata derived (CC BY-NC 4.0) from the Mapping Dubliners
     Project by Jasmine Mulliken, PhD.
   - Ulysses: an original dataset compiled here from the public-domain text
     (1922), grouped by the novel's 18 episodes; coordinates via OSM.

   A work is a list of colour-coded `groups` (stories or episodes); every
   GeoJSON feature carries a `story` property naming its group. */

(function () {
  "use strict";

  // ── Dubliners: the 15 stories in Joyce's order ──
  var DUBLINERS_GROUPS = [
    { key: "The Sisters",                   de: "Die Schwestern",            color: "#b5651d" },
    { key: "An Encounter",                  de: "Eine Begegnung",            color: "#1f6f6f" },
    { key: "Araby",                         de: "Araby",                     color: "#8e44ad" },
    { key: "Eveline",                       de: "Eveline",                   color: "#2c7a3f" },
    { key: "After the Race",                de: "Nach dem Rennen",           color: "#c0392b" },
    { key: "Two Gallants",                  de: "Zwei Kavaliere",            color: "#16735b" },
    { key: "The Boarding House",            de: "Die Pension",               color: "#a67c00" },
    { key: "A Little Cloud",                de: "Eine kleine Wolke",         color: "#2980b9" },
    { key: "Counterparts",                  de: "Gegenstücke",               color: "#7d5a2b" },
    { key: "Clay",                          de: "Lehm",                      color: "#6b8e23" },
    { key: "A Painful Case",                de: "Ein betrüblicher Fall",     color: "#9b1d4f" },
    { key: "Ivy Day in the Committee Room", de: "Efeutag im Sitzungszimmer", color: "#33691e" },
    { key: "A Mother",                      de: "Eine Mutter",               color: "#1565a0" },
    { key: "Grace",                         de: "Gnade",                     color: "#7b3f00" },
    { key: "The Dead",                      de: "Die Toten",                 color: "#34495e" }
  ];

  // ── Ulysses: the 18 episodes (key = English title, matches `story`) ──
  var ULYSSES_GROUPS = [
    { key: "Telemachus",           de: "Telemachos",                   color: "#b5651d" },
    { key: "Nestor",               de: "Nestor",                       color: "#8d6e3a" },
    { key: "Proteus",              de: "Proteus",                      color: "#1f6f6f" },
    { key: "Calypso",              de: "Kalypso",                      color: "#2c7a3f" },
    { key: "Lotus Eaters",         de: "Lotophagen",                   color: "#6b8e23" },
    { key: "Hades",                de: "Hades",                        color: "#34495e" },
    { key: "Aeolus",               de: "Aiolos",                       color: "#2980b9" },
    { key: "Lestrygonians",        de: "Laistrygonen",                 color: "#a67c00" },
    { key: "Scylla and Charybdis", de: "Skylla und Charybdis",         color: "#8e44ad" },
    { key: "Wandering Rocks",      de: "Irrfelsen",                    color: "#16735b" },
    { key: "Sirens",               de: "Sirenen",                      color: "#c0392b" },
    { key: "Cyclops",              de: "Zyklop",                       color: "#7b3f00" },
    { key: "Nausicaa",             de: "Nausikaa",                     color: "#d2691e" },
    { key: "Oxen of the Sun",      de: "Die Rinder des Sonnengottes",  color: "#9b1d4f" },
    { key: "Circe",                de: "Kirke",                        color: "#6a1b9a" },
    { key: "Eumaeus",              de: "Eumaios",                      color: "#1565a0" },
    { key: "Ithaca",               de: "Ithaka",                       color: "#33691e" },
    { key: "Penelope",             de: "Penelope",                     color: "#7d5a2b" }
  ];

  // ── A Portrait of the Artist as a Young Man: the 5 chapters ──
  var PORTRAIT_GROUPS = [
    { key: "Chapter 1", de: "Kapitel 1", color: "#b5651d" },
    { key: "Chapter 2", de: "Kapitel 2", color: "#2c7a3f" },
    { key: "Chapter 3", de: "Kapitel 3", color: "#8e44ad" },
    { key: "Chapter 4", de: "Kapitel 4", color: "#c0392b" },
    { key: "Chapter 5", de: "Kapitel 5", color: "#1565a0" }
  ];

  var WORKS = {
    dubliners: { file: "data/dubliners.geojson", groups: DUBLINERS_GROUPS, en: "Dubliners", de: "Dubliner" },
    ulysses:   { file: "data/ulysses.geojson",   groups: ULYSSES_GROUPS,  en: "Ulysses",   de: "Ulysses", exp: true },
    portrait:  { file: "data/portrait.geojson",  groups: PORTRAIT_GROUPS, en: "Portrait",  de: "Porträt", exp: true }
  };

  var I18N = {
    de: {
      tagline: { dubliners: "Die Orte aus James Joyces »Dubliner« auf der Karte.",
                 ulysses: "Die Schauplätze von James Joyces »Ulysses«, nach Episoden.",
                 portrait: "Stephen Dedalus' Weg in »Ein Porträt des Künstlers als junger Mann«, nach Kapiteln." },
      showAll: "Alle zeigen", hideAll: "Alle aus", route: "Route", page: "S.", ref: "Episode",
      exp: "experimentell",
      expNote: "Experimentell · eigener, noch unvollständiger Datensatz; Zitate noch nicht final geprüft.",
      creditU: 'Eigener Datensatz aus dem gemeinfreien Text des »Ulysses« (1922) · Koordinaten © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      creditP: 'Eigener Datensatz aus dem gemeinfreien Text von »A Portrait of the Artist as a Young Man« (1916) · Koordinaten © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      creditD: 'Geodaten abgeleitet aus dem <a href="https://mappingdubliners.org/" target="_blank" rel="noopener">Mapping Dubliners Project</a> von Jasmine Mulliken (CC&nbsp;BY-NC&nbsp;4.0) · Karte © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>-Mitwirkende'
    },
    en: {
      tagline: { dubliners: "The places of James Joyce's Dubliners, mapped.",
                 ulysses: "The settings of James Joyce's Ulysses, by episode.",
                 portrait: "Stephen Dedalus's path through A Portrait of the Artist as a Young Man, by chapter." },
      showAll: "Show all", hideAll: "Hide all", route: "Route", page: "p.", ref: "Episode",
      exp: "experimental",
      expNote: "Experimental · an original, still-incomplete dataset; quotes not yet finally verified.",
      creditU: 'Original dataset from the public-domain text of Ulysses (1922) · coordinates © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      creditP: 'Original dataset from the public-domain text of A Portrait of the Artist as a Young Man (1916) · coordinates © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      creditD: 'Geodata derived from the <a href="https://mappingdubliners.org/" target="_blank" rel="noopener">Mapping Dubliners Project</a> by Jasmine Mulliken (CC&nbsp;BY-NC&nbsp;4.0) · Map © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }
  };

  var DUBLIN = [53.3478, -6.2597];
  var params = new URLSearchParams(location.search);
  // German UI is temporarily disabled: the literary quotes are English (the
  // source text), so a German chrome would be only half-translated. The i18n
  // dictionary and the per-group German titles are kept intact — re-enable by
  // restoring the .lang-switch in index.html and the detection line below:
  //   var lang = (params.get("lang") || (navigator.language||"en").slice(0,2)) === "de" ? "de" : "en";
  var lang = "en";
  var work = WORKS[params.get("work")] ? params.get("work") : "dubliners";

  var map, layers = {}, bounds = {}, placesByGroup = {};

  function groupsOf() { return WORKS[work].groups; }
  function groupFor(story) {
    return groupsOf().find(function (g) { return g.key === story; });
  }
  function colorFor(story) { var g = groupFor(story); return g ? g.color : "#777"; }
  function titleFor(story) { var g = groupFor(story); return g ? (lang === "de" ? g.de : g.key) : story; }

  function esc(s) {
    return (s || "").replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  function popupHtml(p) {
    var t = I18N[lang];
    var h = '<div class="pop-name">' + esc(p.name);
    if (p.kind === "route") h += ' <span style="font-weight:400;color:#9a8a7a">(' + t.route + ")</span>";
    h += "</div>";
    var sub = titleFor(p.story);
    if (work === "ulysses" && p.episode) sub = t.ref + " " + p.episode + " · " + sub;
    h += '<div class="pop-story">' + esc(sub) + "</div>";
    if (p.gloss) h += '<div class="pop-gloss">' + esc(p.gloss) + "</div>";
    if (p.quote) {
      h += '<div class="pop-quote">' + esc(p.quote);
      if (p.page) h += '<span class="pop-page">' + t.page + " " + p.page + "</span>";
      else if (p.ref) h += '<span class="pop-page">' + esc(p.ref) + "</span>";
      h += "</div>";
    }
    return h;
  }

  function inDublin(lat, lon) {
    return lat > 53.0 && lat < 53.7 && lon > -6.7 && lon < -6.0;
  }

  function clearLayers() {
    Object.keys(layers).forEach(function (k) {
      if (map.hasLayer(layers[k])) map.removeLayer(layers[k]);
    });
    layers = {}; bounds = {};
  }

  function loadWork() {
    clearLayers();
    groupsOf().forEach(function (g) { layers[g.key] = L.layerGroup().addTo(map); });

    placesByGroup = {};
    groupsOf().forEach(function (g) { placesByGroup[g.key] = []; });

    fetch(WORKS[work].file)
      .then(function (r) { return r.json(); })
      .then(function (geo) {
        var all = L.latLngBounds([]), dublin = L.latLngBounds([]);
        geo.features.forEach(function (f) {
          var p = f.properties, grp = layers[p.story];
          if (!grp) return;
          var layer;
          if (f.geometry.type === "Point") {
            var ll = [f.geometry.coordinates[1], f.geometry.coordinates[0]];
            layer = L.circleMarker(ll, { radius: 6, weight: 1.5, color: "#fff",
              fillColor: colorFor(p.story), fillOpacity: 0.9 });
            all.extend(ll); if (inDublin(ll[0], ll[1])) dublin.extend(ll);
            (bounds[p.story] = bounds[p.story] || L.latLngBounds([])).extend(ll);
          } else if (f.geometry.type === "LineString") {
            var lls = f.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
            layer = L.polyline(lls, { color: colorFor(p.story), weight: 3, opacity: 0.65, dashArray: "5,5" });
            lls.forEach(function (ll) {
              all.extend(ll); if (inDublin(ll[0], ll[1])) dublin.extend(ll);
              (bounds[p.story] = bounds[p.story] || L.latLngBounds([])).extend(ll);
            });
          }
          if (layer) {
            // maxHeight lets Leaflet add a scrollbar when a long quote would
            // otherwise overflow the map and get clipped; autoPan (default)
            // also nudges the popup into view.
            layer.bindPopup(popupHtml(p), { maxWidth: 300, maxHeight: 260 });
            layer.addTo(grp);
            (placesByGroup[p.story] || (placesByGroup[p.story] = [])).push({
              name: p.name,
              kind: p.kind || (f.geometry.type === "LineString" ? "route" : "place"),
              layer: layer
            });
          }
        });
        if (dublin.isValid()) map.fitBounds(dublin.pad(0.05));
        else if (all.isValid()) map.fitBounds(all.pad(0.05));
        buildSidebar();
      })
      .catch(function (e) {
        document.getElementById("story-list").innerHTML =
          '<p style="padding:1em;font-size:0.85rem">Could not load data: ' + e + "</p>";
      });
  }

  // Pan/zoom to a single place and open its popup, making sure its group
  // layer is switched on first.
  function focusPlace(groupKey, entry, item) {
    if (!map.hasLayer(layers[groupKey])) {
      layers[groupKey].addTo(map);
      if (item) item.classList.remove("off");
    }
    if (entry.kind === "route" && entry.layer.getBounds) {
      map.flyToBounds(entry.layer.getBounds().pad(0.3));
    } else if (entry.layer.getLatLng) {
      map.flyTo(entry.layer.getLatLng(), 16);
    }
    entry.layer.openPopup();
  }

  function buildSidebar() {
    var t = I18N[lang];
    var box = document.getElementById("story-list");
    box.innerHTML = "";
    groupsOf().forEach(function (g, idx) {
      var entries = placesByGroup[g.key] || [];
      var label = lang === "de" ? g.de : g.key;
      if (work === "ulysses") label = (idx + 1) + ". " + label;

      // ── the group row (click = expand/collapse; swatch = layer on/off) ──
      var item = document.createElement("div");
      item.className = "story-item";
      item.innerHTML =
        '<span class="caret">▸</span>' +
        '<span class="swatch" style="background:' + g.color + '" title="' +
          (lang === "de" ? "Ebene ein/aus" : "toggle layer") + '"></span>' +
        '<span class="story-name">' + esc(label) + "</span>" +
        '<span class="count">' + entries.length + "</span>";

      // ── the collapsible list of this group's places ──
      var sub = document.createElement("div");
      sub.className = "place-list";
      sub.hidden = true;
      entries.forEach(function (e) {
        var pi = document.createElement("div");
        pi.className = "place-item";
        pi.innerHTML = esc(e.name) +
          (e.kind === "route" ? ' <span class="pl-route">' + t.route + "</span>" : "");
        pi.addEventListener("click", function (ev) {
          ev.stopPropagation();
          focusPlace(g.key, e, item);
        });
        sub.appendChild(pi);
      });

      item.addEventListener("click", function () {
        var opening = sub.hidden;
        sub.hidden = !opening;
        item.classList.toggle("expanded", opening);
        if (opening && !map.hasLayer(layers[g.key])) {
          layers[g.key].addTo(map);
          item.classList.remove("off");
        }
      });

      item.querySelector(".swatch").addEventListener("click", function (ev) {
        ev.stopPropagation();
        var turnOn = !map.hasLayer(layers[g.key]);
        if (turnOn) layers[g.key].addTo(map); else map.removeLayer(layers[g.key]);
        item.classList.toggle("off", !turnOn);
      });

      box.appendChild(item);
      box.appendChild(sub);
    });
  }

  function setVisible(show) {
    document.querySelectorAll(".story-item").forEach(function (item, i) {
      var key = groupsOf()[i].key;
      item.classList.toggle("off", !show);
      if (show) layers[key].addTo(map); else map.removeLayer(layers[key]);
    });
  }

  function applyLang() {
    var t = I18N[lang];
    document.documentElement.lang = lang;
    var tagEl = document.getElementById("tagline");
    if (WORKS[work].exp) {
      tagEl.innerHTML = esc(t.tagline[work]) + ' <span class="exp-note">— ' + esc(t.expNote) + "</span>";
    } else {
      tagEl.textContent = t.tagline[work];
    }
    document.getElementById("btnShowAll").textContent = t.showAll;
    document.getElementById("btnHideAll").textContent = t.hideAll;
    document.getElementById("credit").innerHTML =
      work === "ulysses" ? t.creditU : work === "portrait" ? t.creditP : t.creditD;
    var bd = document.getElementById("btnDe"), be = document.getElementById("btnEn");
    if (bd) bd.className = lang === "de" ? "active" : "";
    if (be) be.className = lang === "en" ? "active" : "";
    ["dubliners", "ulysses", "portrait"].forEach(function (w) {
      var el = document.getElementById("work-" + w);
      el.className = work === w ? "active" : "";
      el.innerHTML = esc(WORKS[w][lang]) +
        (WORKS[w].exp ? ' <sup class="exp" title="' + esc(t.expNote) + '">' + esc(t.exp) + "</sup>" : "");
    });
  }

  // Language and work switches reload with query params so popups and the
  // legend rebuild cleanly in one place.
  window.switchLang = function (l) {
    if (l === lang) return;
    params.set("lang", l); location.search = params.toString();
  };
  window.switchWork = function (w) {
    if (w === work || !WORKS[w]) return;
    params.set("work", w); location.search = params.toString();
  };

  document.addEventListener("DOMContentLoaded", function () {
    map = L.map("map", { zoomControl: true }).setView(DUBLIN, 13);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    applyLang();
    loadWork();
    document.getElementById("btnShowAll").addEventListener("click", function () { setVisible(true); });
    document.getElementById("btnHideAll").addEventListener("click", function () { setVisible(false); });
  });
})();
