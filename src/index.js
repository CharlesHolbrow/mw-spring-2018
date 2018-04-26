
import Tone from 'tone';
import SVG from 'svg.js';

var svgRoot = window.svgRoot = document.getElementById('svg-root');
var outer = window.outer = document.getElementById('outer');


var camera = window.camera = {x:0, y: 0};
var panToCamera = window.panToCamera = function() {
  var svgBox = svgRoot.getBoundingClientRect();
  var outerBox = outer.getBoundingClientRect();

  // Panning to scrollXY will put svg origin in the upper left of 'outer'
  var scrollX = svgBox.width * 0.5;
  var scrollY = svgBox.height * 0.5;

  // Move the svg origin to the center of the screen
  scrollX -= (outerBox.width * 0.5);
  scrollY -= (outerBox.height * 0.5);

  // Then adjust the camera
  scrollX += camera.x;
  scrollY += camera.y;

  console.log('Pan to', Math.floor(scrollX), Math.floor(scrollY));
  outer.scrollTo(Math.floor(scrollX), Math.floor(scrollY));
};


window.addEventListener('resize', function(){
  console.log('resize:', window.innerWidth, window.innerHeight);
  panToCamera();
});

outer.addEventListener('scroll', function(){
  console.log('scroll', outer.scrollLeft, outer.scrollTop);
});


panToCamera();

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
