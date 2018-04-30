import Tone from 'tone';
import SVG from 'svg.js';

import { threeSaturationLevels } from './colors.js';

var SIZE = 100;
var SPACING = 116;

export default class Cell {
  constructor(id, state) {
    //state: {subKey: "piano:main", audioPath: "", x: 1, y: 4}

    // default values
    this.radius = 10;
    this.hue = Math.random();
    this.colors = threeSaturationLevels(this.hue)
    this.pos = {x:0, y:0};
    this.pixelPos = {x:0, y:0};

    var audioPath = state.audioPath;
    delete state.audioPath;

    this.update(state); updates

    this.synth = new Tone.Sampler({
      61: audioPath,
    }, () => {}).toMaster();

    this.meter = new Tone.Meter(0.9);
    this.synth.connect(this.meter);
    this.framesDrawn = 0;

    this.svg = new SVG.Rect()
      .size(SIZE, SIZE)
      .radius(this.radius)
      .x(this.pixelPos.x)
      .y(this.pixelPos.y).fill('#ccc');

    this.svg.on('click', () => {
      console.log('click', this.id);
      this.play();
    });
  }

  update(state) {
    if (typeof state.x === 'number') this.x = state.x;
    if (typeof state.y === 'number') this.y = state.y;
    if (typeof state.hue === 'number') this.hue = state.hue;
  }

  teardown() {
    this.synth.dispose();
    this.meter.dispose()
    if (this.svg) this.svg.remove();
  }

  setParent(parent) {
    parent.add(this.svg);
    // Filters and gradients are nested under the parent, and referenced from
    // children. So both filters and gradients are referenced as peers. This
    // means that filters and gradients should be created on the parent so they
    // can be found by their peers.

    var initialBlur = 0;
    this.svg.filter((add) => {
      // There is a bug where the gaussian blur stdDeviation value is set as a
      // string, not a number. This means it cannot be animated using SVG.js.
      this.filter = add.gaussianBlur(initialBlur);
    }).size('200%','200%').move('-50%', '-50%');
    this.filter.attr('stdDeviation', initialBlur); // hack/fix

    this.gradient = parent.gradient('radial', (stop) => {
      stop.at(0.0, this.colors[2], 1.0);
      stop.at(1.0, this.colors[0], 1.0);
    }).radius(0.0);

    this.svg.fill(this.gradient);
  }

  set x(value) {
    this.pos.x = value;
    this.pixelPos.x = value * SPACING;
    if (this.svg) this.svg.x(this.pixelPos.x);
    return this;
  }

  set y(value) {
    this.pos.y = value;
    this.pixelPos.y = value * SPACING;
    if (this.svg) this.svg.y(this.pixelPos.y);
    return this;
  }

  get x() {
    return this.pos.x;
  }

  get y() {
    return this.pos.y;
  }


  play() {
    if (!this.synth.loaded) {
      console.warn('Cannot play: samples not loaded');
      return;
    }

    if (!this.svg) {
      Console.warn('Cannot play: cell has no parent');
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