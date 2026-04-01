// ── Strophe timestamps (seconds) for audio synchronisation ──
// Each entry corresponds to a paragraph in texts.json (index 0 = subtitle).
// Kept separate from text content because timestamps are audio-specific
// and may vary between recordings / spoken versions.

var AUDIO_TIMESTAMPS = {
  de: {
    odysseus: [
      { start: 0, end: 7 },
      { start: 7, end: 45 },
      { start: 50, end: 120 },
      { start: 190, end: 252 },
      { start: 254, end: 285 },
      { start: 285, end: 312 }
    ],
    siren: [
      { start: 0, end: 4 },
      { start: 4, end: 30 },
      { start: 30, end: 60 },
      { start: 60, end: 92 },
      { start: 94, end: 135 },
      { start: 135, end: 188 },
      { start: 190, end: 252 },
      { start: 252, end: 315 },
      { start: 315, end: 345 }
    ]
  },
  en: {
    odysseus: [
      { start: 0, end: 4 },
      { start: 4, end: 38 },
      { start: 40, end: 98 },
      { start: 171, end: 212 },
      { start: 231, end: 252 },
      { start: 253, end: 270 }
    ],
    siren: [
      { start: 0, end: 4 },
      { start: 4, end: 29 },
      { start: 30, end: 56 },
      { start: 57, end: 87 },
      { start: 88, end: 123 },
      { start: 124, end: 169 },
      { start: 171, end: 230 },
      { start: 231, end: 283 },
      { start: 284, end: 309 }
    ]
  }
};
