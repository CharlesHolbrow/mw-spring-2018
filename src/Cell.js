import Tone from 'tone';
import SVG from 'svg.js';

import { threeSaturationLevels } from './colors.js';

export default class Cell {
  constructor(parent, ops){

    // default values
    ops = typeof ops === 'undefined' ? {} : ops;
    this.hue = typeof ops.hue === 'number' ? ops.hue : Math.random();
    this.size = typeof ops.size === 'number' ? ops.size : 100;
    this.radius = typeof ops.radius === 'number' ? ops.radius : 10;

    this.colors = threeSaturationLevels(this.hue)
    this.gradient = main.gradient('radial', (stop) => {
      stop.at(0.0, this.colors[2], 1.0);
      stop.at(1.0, this.colors[0], 1.0);
    }).radius(0.0);

    this.svg = parent
      .rect(this.size, this.size)
      .radius(this.radius)
      .fill(this.gradient);

    this.svg.on('click', () => {
      this.play();
    });

    var initialBlur = 0;
    this.svg.filter((add) => {
      // There is a bug where the gaussian blur stdDeviation value is set as a
      // string, not a number.
      this.filter = add.gaussianBlur(initialBlur);
    }).size('200%','200%').move('-50%', '-50%');
    this.filter.attr('stdDeviation',initialBlur) // hacky fix

    this.synth = new Tone.Sampler({
      61: './sound/delmar-end.wav',
    }, () => {

    }).toMaster();

    this.follower = new Tone.Follower(0.02, 0.5);
    this.meter = new Tone.Meter(0.9);
    this.synth.connect(this.meter);
    this.framesDrawn = 0;
  }

  x(value) {
    this.svg.x(value);
    return this;
  }

  y(value) {
    this.svg.y(value);
    return this;
  }

  play() {
    if (!this.synth.loaded) {
      console.warn('Cannot play: samples not loaded')
      return;
    }

    this.framesDrawn = 0;
    this.synth.triggerAttackRelease(Tone.Frequency(61, 'midi'), 12);

    // This is a little sloppy, because we are playing multiple samples at the
    // same time, we end up with redundant .draw() calls.
    this.animate()
  }

  blur(value, ms) {
    var ms = typeof ms === 'number' ? ms : 1000;
    this.filter.animate(ms).attr('stdDeviation', value);
  }

  /**
   * This should be called once inside each animation frame.
   * @returns {bool} - finished
   */
  draw() {
    var db = this.meter.getLevel();
    var gain = db > -240 ?  Tone.dbToGain(db) : 0;

    this.gradient.radius(gain);
    this.framesDrawn++;

    if (this.framesDrawn > 100 && gain === 0) return true;
    return false;
  }

  animate() {
    window.requestAnimationFrame((hrTime) => {
      this.draw() || this.animate();
    });
  }
}