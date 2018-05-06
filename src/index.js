
import Tone from 'tone';
import SVG from 'svg.js';

import { threeSaturationLevels } from './colors.js';

import Cell from './Cell.js';
import App from './App.js';

// Never finished - the server should be changing all the time.
// Other users can remix -
// Watch other listeners movement
// Real-time -- so you might miss something. Time matters
// To think about:
//
// Paths from sounds
// Layers? Muriel Cooper?
//
// The shortest sample is B2-min-003.wav @ 1.335 seconds

Tone.context.latencyHint = 0.1;

var svgRoot = document.getElementById('svg-parent');
var app = window.app = new App(svgRoot);

app.focusOnChunk(0, 0);
