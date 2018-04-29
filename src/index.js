
import Tone from 'tone';
import SVG from 'svg.js';

import './scroll.js';
import { threeSaturationLevels } from './colors.js';

import Cell from './Cell.js';
import App from './App.js';

// Never finished
// Other users can remix
// Watch other listeners movement

// var filter = window.filter = new SVG.Filter();
// var fBlur = window.fBlur = filter.gaussianBlur(15);
// filter.size('200%','200%').move('-50%', '-50%');

var main = window.main = SVG(svgRoot).size(210, 210);

var app = window.app = new App(main);
