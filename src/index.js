
import Tone from 'tone';
import SVG from 'svg.js';

import Cell from './Cell.js';
import './scroll.js';
import { threeSaturationLevels } from './colors.js';

// Never finished
// Other users can remix
// Watch other listeners movement

var filter = window.filter = new SVG.Filter();
var fBlur = window.fBlur = filter.gaussianBlur(15);
filter.size('200%','200%').move('-50%', '-50%');

var main = window.main = SVG(svgRoot).size(210, 210);

var size = 100;
var spacing = 16;
var cellSize = size + spacing;

var c1 = new Cell(main).x(0).y(0);
var c2 = new Cell(main).x(110).y(110);
var c3 = new Cell(main).x(-110).y(-110);

var cells = window.cells = [c1, c2, c3];

setTimeout(() =>{cells[0].play()}, 1000);
