// ── Strophe timestamps (seconds) for audio synchronisation ──
// Each entry corresponds to a paragraph in texts.json (index 0 = subtitle).
// Kept separate from text content because timestamps are audio-specific
// and may vary between recordings / spoken versions.

var AUDIO_TIMESTAMPS = {
  de: {
    odysseus: [
      { start: 2, end: 7 },
      { start: 9, end: 45 },
      { start: 52, end: 120 },
      { start: 192, end: 252 },
      { start: 256, end: 285 },
      { start: 287, end: 312 }
    ],
    siren: [
      { start: 2, end: 4 },
      { start: 6, end: 30 },
      { start: 32, end: 60 },
      { start: 62, end: 92 },
      { start: 96, end: 135 },
      { start: 137, end: 188 },
      { start: 191, end: 252 },
      { start: 254, end: 315 },
      { start: 317, end: 345 }
    ]
  },
  en: {
    odysseus: [
      { start: 2, end: 5 },
      { start: 9, end: 54 },
      { start: 64, end: 145 },
      { start: 232, end: 300 },
      { start: 332, end: 357 },
      { start: 364, end: 391 }
    ],
    siren: [
      { start: 2, end: 3 },
      { start: 7, end: 38 },
      { start: 41, end: 76 },
      { start: 79, end: 117 },
      { start: 121, end: 163 },
      { start: 167, end: 227 },
      { start: 231, end: 327 },
      { start: 332, end: 414 },
      { start: 417, end: 452 }
    ]
  }
};
