import Tone from 'tone';
import SVG from 'svg.js';

import { threeSaturationLevels } from './colors.js';

var SIZE = 100;
var SPACING = 116;

export default class Cell {
  constructor(id, state) {
    //state: {subKey: "piano:main", audioPath: "", x: 1, y: 4}
    console.log('creating new Cell:', state)

    // default values
    this.hue = Math.random();
    this.radius = 10;
  
    this.pos = {x:0, y:0};
    this.xy = {x:0, y:0};

    this.update(state);

    this.colors = threeSaturationLevels(this.hue)
    
    this.synth = new Tone.Sampler({
      61: './sound/delmar-end.wav',
    }, () => {}).toMaster();

    this.meter = new Tone.Meter(0.9);
    this.synth.connect(this.meter);
    this.framesDrawn = 0;
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

  setParent(main) {
    if (this.svg) {
      throw new Error("Cell already has parent");
    }

    this.gradient = main.gradient('radial', (stop) => { // charles: parent/main/svg????
      stop.at(0.0, this.colors[2], 1.0);
      stop.at(1.0, this.colors[0], 1.0);
    }).radius(0.0);

    this.svg = main
      .rect(SIZE, SIZE)
      .radius(this.radius)
      .x(this.xy.x)
      .y(this.xy.y)
      .fill(this.gradient);

    // update svg position
    this.x = this.x;
    this.y = this.y;

    this.svg.on('click', () => {
      console.log('click', this.id);
      this.play();
    });

    var initialBlur = 0;
    this.svg.filter((add) => {
      // There is a bug where the gaussian blur stdDeviation value is set as a
      // string, not a number.
      this.filter = add.gaussianBlur(initialBlur);
    }).size('200%','200%').move('-50%', '-50%');
    this.filter.attr('stdDeviation',initialBlur); // hacky fix
  }

  set x(value) {
    this.pos.x = value;
    this.xy.x = value * SPACING;
    if (this.svg) this.svg.x(this.xy.x);
    return this;
  }

  set y(value) {
    this.pos.y = value;
    this.xy.y = value * SPACING;
    if (this.svg) this.svg.y(this.xy.y);
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