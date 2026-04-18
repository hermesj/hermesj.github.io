// ══════════════════════════════════════════════════════
// Figure and Ground — shared audio prototype logic
// Used by audio-prototype.html and audio-prototype-2.html
// Depends on: figround.js (FIGROUND), audio-timestamps.js (AUDIO_TIMESTAMPS)
// ══════════════════════════════════════════════════════

// ── Scroll hint: show only when content overflows ──
(function() {
  const hint = document.getElementById('scrollHint');
  function checkOverflow() {
    hint.style.display = document.body.scrollHeight > window.innerHeight ? '' : 'none';
  }
  checkOverflow();
  window.addEventListener('resize', checkOverflow);
  window.addEventListener('scroll', function() {
    if (window.scrollY > 30) {
      hint.style.opacity = '0';
      setTimeout(() => hint.style.display = 'none', 500);
    }
  });
})();

// ── Audio state ──

const AUDIO_FILES = {
  de: { odysseus: 'audio/Odysseus_de/odysseus_de_indexed.mp3', siren: 'audio/Siren_de/siren_de_indexed.mp3' },
  en: { odysseus: 'audio/Odysseus_en/odysseus_en_indexed.mp3', siren: 'audio/Siren_en/siren_en_indexed.mp3' },
};

let audioCtx = null;
let buffers = { de: {}, en: {} };
let sources = { odysseus: null, siren: null };
let gains = { odysseus: null, siren: null };
let panners = { odysseus: null, siren: null };

let currentLang = FIGROUND.detectLang();
let isPlaying = false;
let startTime = 0;      // audioCtx.currentTime when playback started
let pauseOffset = 0;    // how far into the track we paused
let loadedCount = 0;
const totalFiles = 4;

// Stereo panning range: how far left/right the voices sit
// -1 = hard left, +1 = hard right
const PAN_ODYSSEUS_BASE = -0.35;  // Odysseus slightly left
const PAN_SIREN_BASE = 0.35;     // Siren slightly right

// ── Playback primitives ──
// (startPlayback() stays per-page: proto-2 adds onended handlers.)

function stopSources() {
  try { sources.odysseus?.stop(); } catch(e) {}
  try { sources.siren?.stop(); } catch(e) {}
  sources.odysseus = null;
  sources.siren = null;
}

function stopPlayback() {
  pauseOffset = 0;
  isPlaying = false;
  stopSources();
  updatePlayButton();
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('timeCurrent').textContent = '0:00';
}

function togglePlay() {
  if (audioCtx.state === 'suspended') audioCtx.resume();

  if (isPlaying) {
    pauseOffset = getCurrentTime();
    isPlaying = false;
    stopSources();
  } else {
    startPlayback(pauseOffset);
  }
  updatePlayButton();
}

// ── Play button: SVG icon + label ──
// Both prototypes use a markup pattern of:
//   <button id="btnPlay">
//     <span id="btnPlayIcon"></span>
//     <span id="btnPlayLabel">Play</span>
//   </button>

const PLAY_ICON_SVG  = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M6 4.5 L16 10 L6 15.5 Z"/></svg>';
const PAUSE_ICON_SVG = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="7.5" y1="5" x2="7.5" y2="15"/><line x1="12.5" y1="5" x2="12.5" y2="15"/></svg>';

function updatePlayButton() {
  const iconEl  = document.getElementById('btnPlayIcon');
  const labelEl = document.getElementById('btnPlayLabel');
  if (iconEl)  iconEl.innerHTML   = isPlaying ? PAUSE_ICON_SVG : PLAY_ICON_SVG;
  if (labelEl) labelEl.textContent = isPlaying ? 'Pause'        : 'Play';
}

function getCurrentTime() {
  if (!isPlaying) return pauseOffset;
  return audioCtx.currentTime - startTime;
}

function getMaxDuration() {
  if (!buffers[currentLang].odysseus || !buffers[currentLang].siren) return 0;
  return Math.max(
    buffers[currentLang].odysseus.duration,
    buffers[currentLang].siren.duration
  );
}

function updateDuration() {
  const dur = getMaxDuration();
  document.getElementById('timeDuration').textContent = formatTime(dur);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

// ── Scrolling ticker ──

let tickerData = { odysseus: null, siren: null };

// 'odysseus' = light button, Ody normal L→R, Siren mirrored R→L
// 'siren'    = dark button,  Siren normal L→R, Ody mirrored R→L
let perspectiveMode = 'odysseus';

function initTickers() {
  const lang = currentLang;
  const ts = AUDIO_TIMESTAMPS[lang];
  const figroundData = FIGROUND.data[lang];

  for (const voice of ['odysseus', 'siren']) {
    const el = document.getElementById(voice === 'odysseus' ? 'tickerTextOdy' : 'tickerTextSir');

    // Build ticker text from FIGROUND data using renderTicker
    const tickerHtml = FIGROUND.renderTicker(figroundData[voice]);
    const parts = tickerHtml.split(' ◆ ');

    if (ts && ts[voice] && parts.length === ts[voice].length) {
      // Wrap each strophe in a measurable span, with spaced separators
      el.innerHTML =
        parts.map((part, i) =>
          '<span class="strophe" data-strophe="' + i + '">' + part + '</span>'
        ).join('<span class="strophe-sep">&nbsp;&nbsp;&nbsp; ◆ &nbsp;&nbsp;&nbsp;</span>') +
        '<span class="strophe-pad">&nbsp;&nbsp;&nbsp;&nbsp;</span>';

      // Force layout, then measure strophe pixel positions
      void el.offsetWidth;
      const stropheEls = el.querySelectorAll('.strophe');
      const ranges = [];
      stropheEls.forEach(s => {
        ranges.push({
          left: s.offsetLeft,
          width: s.offsetWidth,
          right: s.offsetLeft + s.offsetWidth,
        });
      });

      tickerData[voice] = {
        ranges: ranges,
        timestamps: ts[voice],
        totalWidth: el.scrollWidth,
      };
    } else {
      // No timestamps available — plain text, linear fallback
      el.innerHTML = tickerHtml;
      tickerData[voice] = null;
    }
  }
}

function togglePerspective() {
  const btn = document.getElementById('perspToggle');
  if (perspectiveMode === 'odysseus') {
    perspectiveMode = 'siren';
    btn.classList.remove('mode-odysseus');
    btn.classList.add('mode-siren');
  } else {
    perspectiveMode = 'odysseus';
    btn.classList.remove('mode-siren');
    btn.classList.add('mode-odysseus');
  }
}

// Convert current playback time to a 0..1 scroll progress for one voice,
// taking strophe boundaries and pauses into account.
function getScrollProgress(voice, currentTime, duration) {
  const data = tickerData[voice];
  if (!data) {
    // Linear fallback (no timestamps for this language)
    return duration > 0 ? currentTime / duration : 0;
  }

  const { ranges, timestamps, totalWidth } = data;
  if (totalWidth === 0) return 0;

  // Before first strophe starts
  if (currentTime < timestamps[0].start) return 0;

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];

    // Currently inside strophe i — interpolate within it
    if (currentTime >= ts.start && currentTime <= ts.end) {
      const t = (currentTime - ts.start) / (ts.end - ts.start);
      const pixelPos = ranges[i].left + t * ranges[i].width;
      return pixelPos / totalWidth;
    }

    // In a pause between strophe i and i+1 — hold at midpoint of separator
    // so the ◆ and the strophe ending stay visible
    if (i < timestamps.length - 1 && currentTime > ts.end && currentTime < timestamps[i + 1].start) {
      var pausePos = (ranges[i].right + ranges[i + 1].left) / 2;
      return pausePos / totalWidth;
    }
  }

  // After all strophes (trailing silence) — include trailing pad
  return Math.min(1, (ranges[ranges.length - 1].right + 60) / totalWidth);
}

function updateTickers(currentTime) {
  const duration = getMaxDuration();

  const odyEl = document.getElementById('tickerTextOdy');
  const sirEl = document.getElementById('tickerTextSir');
  const tickerOdyW = document.getElementById('tickerOdy').offsetWidth;
  const tickerSirW = document.getElementById('tickerSir').offsetWidth;
  const odyTextW = odyEl.scrollWidth;
  const sirTextW = sirEl.scrollWidth;

  const odyProgress = getScrollProgress('odysseus', currentTime, duration);
  const sirProgress = getScrollProgress('siren', currentTime, duration);

  // Gentle lead-in: at progress=0 the text starts ~35% into the ticker,
  // fading to normal scrolling by ~8% progress.
  function leadIn(progress, tickerW) {
    return Math.max(0, (1 - progress * 12)) * tickerW * 0.35;
  }

  if (perspectiveMode === 'odysseus') {
    // Odysseus: normal text, scrolls L→R
    const odyX = leadIn(odyProgress, tickerOdyW) - odyProgress * (odyTextW - tickerOdyW);
    odyEl.style.transform = 'translateY(-50%) translateX(' + odyX + 'px)';

    // Siren: mirrored text, scrolls R→L
    const sirX = tickerSirW - leadIn(sirProgress, tickerSirW) + sirProgress * (sirTextW - tickerSirW);
    sirEl.style.transform = 'translateY(-50%) translateX(' + sirX + 'px) scaleX(-1)';
  } else {
    // Siren: normal text, scrolls L→R
    const sirX = leadIn(sirProgress, tickerSirW) - sirProgress * (sirTextW - tickerSirW);
    sirEl.style.transform = 'translateY(-50%) translateX(' + sirX + 'px)';

    // Odysseus: mirrored text, scrolls R→L
    const odyX = tickerOdyW - leadIn(odyProgress, tickerOdyW) + odyProgress * (odyTextW - tickerOdyW);
    odyEl.style.transform = 'translateY(-50%) translateX(' + odyX + 'px) scaleX(-1)';
  }
}
