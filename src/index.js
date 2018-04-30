
import Tone from 'tone';
import SVG from 'svg.js';

import './scroll.js';
import { threeSaturationLevels } from './colors.js';

import Cell from './Cell.js';
import App from './App.js';

// Never finished - the server should be changing all the time.
// Other users can remix -
// Watch other listeners movement
// Real-time -- so you might miss something. Time matters

var main = window.main = SVG(svgRoot).size(210, 210);

var app = window.app = new App(main);

app.focusOnChunk(0, 0);
