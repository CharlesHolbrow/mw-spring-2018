
import Tone from 'tone';
import SVG from 'svg.js';

import Cell from './Cell.js';
import './scroll.js';
import { threeSaturationLevels } from './colors.js';


var synth = window.synth = new Tone.Sampler({
  61: './sound/delmar-061.wav',
}, () => {
  console.log('hi222');
  synth.triggerAttack(Tone.Frequency(50, 'midi'));
}).toMaster();


var main = window.main = SVG(svgRoot).size(210, 210);

var g1 = main.gradient('radial', (stop) => {
  stop.at(0.0, '#fff', 1.0);
  stop.at(1, '#900', 1.0);
});


var size = 100;
var spacing = 16;
var cellSize = size + spacing;

var cells = window.cells = [];

for (var y = -10; y < 10; y++) {
  for (var x = -10; x < 10; x++) {
    if (!Math.floor(Math.random()*8)) {

      var cell = new Cell(main, {size: 100});
      cell.x(x * size + spacing);
      cell.y(y * size + spacing);
      cells.push(cell);
    }
  }
}

var i = 0;

setInterval(() => {
  for (var i = 0; i < cells.length; i++){
    var cell = cells[i];
    cell.gradient.animate(400).radius(2).animate(300).radius(0.5);
  };
}, 1500);
