import Tone from 'tone';

class Things {
  constructor() {
    this.index = 0;
    this.data = [];
    this.maxOffset = 0.7;
    this.fadeOut = 0.15;
    this.fadeIn = 0;
    this.timeOfLastPush = Number.MIN_VALUE;
  }

  /**
   * advance the pointer,
   */
  advance() {
    if (this.index++ >= (this.data.length-1)) this.index = 0;
    return this;
  }

  /**
  * Get get object (do not advance index)
  */
  get() {
    return this.data[this.index] || null;
  }

  last() {
    return this.data[this.data.length - 1] || null;
  }

  push(thing) {
    this.timeOfLastPush = Tone.now();
    this.data.push(thing);
  }

  clear() {
    this.data = [];
    this.index = 0;
  }

  restart() {
    this.index = 0;
  }

  get length() {
    return this.data.length;
  }

  secondsSinceLastPush() {
    return Tone.now() - this.timeOfLastPush;
  }

  divisions(divisions) {
    const length = new Tone.Time('1m').toSeconds() / divisions;
    const loop = new Tone.Loop((time) => {
      // We specify loop.start(transportTime), but inside this callback, the
      // time argument is a Tone.context time.
      const offset = Math.random() * this.maxOffset;
      const thing = this.get();
      if (thing) {
        thing.object.play(time, offset, length, this.fadeIn, this.fadeOut);
      }
      this.advance();
    }, length);

    // No idea why iterations = 1 still plays the damn thing twice.
    loop.iterations = divisions === 1 ? false : divisions;

    return loop;
  }
}


export default class ClickHandler {

  constructor() {
    this.started = false;
    this.things = new Things();
    this.level = 0;

    // Offset divs, so that the index is equal to the divisions
    const divs = window.melodies = [null];
    for (let i = 1; i <= 16; i++) {
      divs.push(this.things.divisions(i));
    }
    divs[0] = divs[1];

    // A curated collection of patterns used below
    let patternIndex = 0;
    const patterns = [
      divs[16], // divisions(16)
      divs[16], // divisions(16)
      divs[16], // divisions(16)
      divs[16], // divisions(16)
    ];
    let pattern;


    let goingUp = true;
    this.control = Tone.Transport.scheduleRepeat((time, event) => {
      // You can't use `time` here, because loop.start expects times
      // relative to the transport, while 'time' is relative to the
      // audioContext.

      const secondsSinceLastPush = this.things.secondsSinceLastPush();
      if (secondsSinceLastPush > Tone.Time('2m').toSeconds()) {
        if (this.level >= 0) this.level--;
        goingUp = false;
      } else if (secondsSinceLastPush < Tone.Time('2m').toSeconds()) {
        this.level++;
        goingUp = true;
      }

      if (goingUp) {
        this.things.fadeOut = 0.15
      } else {
        this.things.fadeOut = 0.8;
      }

      // fade gets faster with higher levels
      let fadeIn = 0.060;
      if (this.level > 4) fadeIn = 0.03;
      if (this.level > 8) fadeIn = 0.01;
      if (this.level > 12) fadeIn = 0.005

      console.log(fadeIn);
      this.things.fadeIn = fadeIn;

      this.level = Math.min(this.level, divs.length -1);
      this.things.restart();
      pattern = divs[this.level];
      if (pattern) pattern.stop().start();

    }, '1m', 1);
  }

  receive(clicked, event) {
    if (!this.started) {
      Tone.Transport.start();
      this.started = true
    }

    const previous = this.things.last();
    const newThing = {
      object: clicked,
      event: event,
      time: event.timeStamp,
      distance: Number.MAX_SAFE_INTEGER,
      deltaTime: Number.MAX_VALUE,
    }

    if (previous) {
      const dx = newThing.object.x - previous.object.x;
      const dy = newThing.object.y - previous.object.y;
      newThing.distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
      newThing.deltaTime = newThing.time - previous.time;
    }

    if (newThing.distance > 3) {
      this.things.clear();
    }

    this.things.push(newThing);
  }
}
