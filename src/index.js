
import Tone from 'tone';
import SVG from 'svg.js';
import './scroll.js';


var synth = window.synth = new Tone.Sampler({
  61: './sound/delmar-061.wav',
}, () => {
  console.log('hi222');
  synth.triggerAttack(Tone.Frequency(50, 'midi'));
}).toMaster();

var main = window.main = SVG(svgRoot).size(210, 210);

var g1 = main.gradient('linear', (stop) => {
  stop.at(0.0, '#000', 0.0);
  stop.at(0.5, '#fff', 1.0);
  stop.at(1.0, '#000', 0.0);
});


// var r1 = main.rect(20, 20).fill('#00f').x(-10).y(-10);
var r2 = main.rect(3000, 30).fill('#55f').y(30).x(-50);
// var r4 = main.rect(800, 3).fill(g1).x(50).radius(4).y(10);
