
import Tone from 'tone';
import SVG from 'svg.js';

const root = document.getElementById('svg-root');

window.addEventListener('resize', function(){
  console.log(window.innerWidth, window.innerHeight);
});

window.addEventListener('scroll', function(){
  const e = document.body;
  console.log(e.scrollTop, e.scrollLeft)
});

setTimeout(() => {
  window.scrollTo(1800, 1800);
}, 10);


const synth = window.synth = new Tone.Sampler({
  61: './sound/delmar-061.wav',
}, () => {
  console.log('hi222');
  synth.triggerAttack(Tone.Frequency(50, 'midi'));
}).toMaster();

const main = window.main = SVG(root).size(210, 210);

const g1 = main.gradient('linear', (stop) => {
  stop.at(0.0, '#000', 0.0);
  stop.at(0.5, '#fff', 1.0);
  stop.at(1.0, '#000', 0.0);
});


const r1 = main.rect(20, 20).fill('#00f').x(-10).y(-10);
const r4 = main.rect(800, 3).fill(g1).x(50).radius(4).y(10);
