import Tone from 'tone';
import SVG from 'svg.js';
import EventEmitter from 'eventemitter3';

import { threeSaturationLevels } from './colors.js';

var SIZE = 100;
var SPACING = 116;

export default class Cell extends EventEmitter {
  constructor(id, state) {
    super();

    // default values
    this.radius = 10;
    this.hue = Math.random();
    this.pos = {x:0, y:0};
    this.pixelPos = {x:0, y:0};
    this.mouseHold = false;

    // The master output for this cell
    this.meter = new Tone.Meter(0.9);
    this.output = new Tone.Gain().connect(this.meter);
    this.players = [];

    // the path to download audio from
    this.audioPath = state.audioPath;
    delete state.audioPath;

    this.update(state);
    this.framesDrawn = 0;

    this.svg = new SVG.Rect()
      .size(SIZE, SIZE)
      .radius(this.radius)
      .x(this.pixelPos.x)
      .y(this.pixelPos.y)
      .draggable()
      .fill('#ccc');

    this.svg.on('click', () => {
      console.log('click', this.id);
      this.play();
    });

    this.svg.on('dragend', (e) => {
      this.moveRelease();
    })
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

    if (typeof state.midiNote === 'number')
      this.midiNote = state.midiNote;
  }

  teardown() {
    this.svg.off(); // unbind all events
    this.svg.remove();
    this.output.dispose();
    if (this.meter) this.meter.dispose();
    for (const player of this.players) {
      player.dispose();
    }
    this.removeAllListeners();
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

  moveByPixels(x, y) {
    this.svg.y(this.svg.y() + y);
    this.svg.x(this.svg.x() + x);
  }

  moveRelease() {
    const newX = Math.round(this.svg.x() / SPACING);
    const newY = Math.round(this.svg.y() / SPACING);

    let changed = false;
    if (newX !== this.x || newY !== this.y) changed = true;

    this.x = newX;
    this.y = newY;

    if (changed) this.emit('moved', newX, newY);
  }


  play(startTime, offset, duration, fadeIn, fadeOut) {
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

    let playMe;
    for (const [i, player] of this.players.entries()) {
      if (player.state === 'stopped') {
        playMe = player;

        // move the found player to the end of the queue
        const catMe = this.players.splice(i, 1);
        this.players = this.players.concat(catMe);

        break;
      }
    }
    // If all players are in use, add two more;
    if (!playMe) {
      playMe = new Tone.Player(this.buffer).connect(this.output);
      this.players.unshift(playMe);
      this.players.unshift(new Tone.Player(this.buffer).connect(this.output));
    }

    if (!offset) {
      offset = 0;
    }

    if (!fadeIn) {
      fadeIn = 0
    }

    // default fade in is 0. Good idea?
    playMe.fadeIn = fadeIn;

    // default fade out is 50ms
    playMe.fadeOut = typeof fadeOut === 'number' ? fadeOut : 0.050;

    // Don't let duration drop below the fade in time.
    if (typeof duration === 'number')
      duration = Math.max(playMe.fadeIn + 0.02, duration + (playMe.fadeOut / 4));
    // BUG(charles): Did not handle a Tone.Time

    playMe.start(startTime, offset, duration);

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

    // In firefox, setting the radius close to 0 causes the object to vanish
    // altogether. Use Math.max to ensure that it never goes that low.
    this.gradient.radius(Math.max(gain, 0.001));
    this.framesDrawn++;

    if (this.framesDrawn > 100 && gain <= 0) return true;
    return false;
  }

  animate() {
    window.requestAnimationFrame((hrTime) => {
      this.draw() || this.animate();
    });
  }
}