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
    this.pos = {x:0, y:0};
    this.pixelPos = {x:0, y:0};

    // The master output for this cell
    this.meter = new Tone.Meter(0.9);
    this.output = new Tone.Gain().toMaster().connect(this.meter);
    this.players = [];

    // the path to download audio from
    this.audioPath = state.audioPath;
    delete state.audioPath;

    this.update(state); updates


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
    if (typeof state.hue === 'number') {
      this.hue = state.hue;
      this.colors = threeSaturationLevels(this.hue);
    }
    if (typeof state.audioPath !== 'undefined')
      console.warn("Changing audioPath is not supported", this.id);
  }

  teardown() {
    this.output.dispose();
    if (this.meter) this.meter.dispose();
    if (this.svg) this.svg.remove();
    for (const player of this.players) player.dispose();
    // We don't dispose of the buffer: it may still be in use by another cell.
  }

  setParent(parent) {
    parent.add(this.svg);
    // Filters and gradients are nested under the parent, and referenced from
    // children. So both filters and gradients are referenced as peers. This
    // means that filters and gradients should be created on the parent so they
    // can be found by their peers.

    this.gradient = parent.gradient('radial', (stop) => {
      stop.at(0.0, this.colors[2], 1.0);
      stop.at(1.0, this.colors[0], 1.0);
    }).radius(0.0);

    this.svg.fill(this.gradient).opacity(0).animate(500).opacity(1);
  }

  setBuffer(buffer) {
    if (buffer === this.buffer) return;

    this.buffer = buffer;
    for (player of this.players) {
      this.player.dispose();
    }
    this.players = [];
  }

  set hue(value) {
    // must be set after svg
    this._hue = value;
    this.colors = threeSaturationLevels(this.hue)
    if (this.gradient) {
      // BUG(charles:) this is brittle
      this.gradient.children()[0].animate(100).attr('stop-color', this.colors[2])
      this.gradient.children()[1].animate(100).attr('stop-color', this.colors[0])
    }
  }

  get hue() {
    return this._hue;
  }

  set x(value) {
    this.pos.x = value;
    this.pixelPos.x = value * SPACING;
    if (this.svg) this.svg.animate(500).x(this.pixelPos.x);
    return this;
  }

  set y(value) {
    this.pos.y = value;
    this.pixelPos.y = value * SPACING;
    if (this.svg) this.svg.animate(500).y(this.pixelPos.y);
    return this;
  }

  get x() {
    return this.pos.x;
  }

  get y() {
    return this.pos.y;
  }


  play() {
    if (!this.buffer || !this.buffer.loaded) {
      console.warn('Cannot play: samples not loaded', this.audioPath);
      return;
    }

    if (!this.svg) {
      Console.warn('Cannot play: cell has no parent');
      return;
    }

    this.framesDrawn = 0;

    // Find a player that is unused
    let started = false;
    for (const player of this.players) {
      if (player.state === 'stopped') {
        player.start();
        started = true;
        break;
      }
    }
    // If all players are in use, add a new one
    if (!started) {
      const player = new Tone.Player(this.buffer).connect(this.output);
      this.players.push(player);
      player.start();
    }

    // This is a little sloppy, because we are playing multiple samples at the
    // same time, we end up with redundant .draw() calls.
    this.animate()
  }

  blur(value, ms) {
    if (!this.filter) {
      var initialBlur = 0;
      this.svg.filter((add) => {
        // There is a bug where the gaussian blur stdDeviation value is set as a
        // string, not a number. This means it cannot be animated using SVG.js.
        this.filter = add.gaussianBlur(initialBlur);
      }).size('200%','200%').move('-50%', '-50%');
      this.filter.attr('stdDeviation', initialBlur); // hack/fix
    }

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