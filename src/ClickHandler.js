import Tone from 'tone';

class Things {
  constructor() {
    this.index = 0;
    this.data = [];
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

  /**
   * Get a Tone.Loop that iterates over things.data
   * @param {Int} measures - Total duration of loop in measures
   */
  sixteenths(measures) {
    measures = measures || 1;
    const noteLength = new Tone.Time('16n');

    const loop = new Tone.Loop((time, event) => {
      const thing = this.get();
      if (thing) thing.object.play(time, 0, noteLength + 0.1);
      this.advance();
    }, '16n');

    loop.iterations = Math.floor(measures * 16);

    return loop;
  }

  divisions(divisions) {
    const length = new Tone.Time('1m').toSeconds() / divisions;

    const loop = new Tone.Loop((time) => {
      // We specify loop.start(transportTime), but inside this callback, the
      // time argument is a Tone.context time.
      const thing = this.get();
      if (thing) {
        thing.object.play(time, 0, length + .15);
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
    this.measure = -1;

    // Offset divs, so that the index is equal to the divisions
    const divs = window.melodies = [null];
    for (let i = 1; i <= 16; i++) {
      divs.push(this.things.divisions(i));
    }
    divs[0] = divs[1];

    // A curated collection of patterns used below
    let patternIndex = 0;
    const patterns = [
      divs[12], // divisions(12)
      divs[16], // divisions(16)
      divs[4],  // divisions(4)
      divs[3],  // divisions(3)
    ];


    let todo = false;
    this.control = Tone.Transport.scheduleRepeat((time, event) => {
      this.measure++;

      const loop = divs[this.measure];
      if (loop && this.measure < 3) {

        loop.start();
        // You can't use `time` here, because loop.start expects times
        // relative to the transport, while 'time' is relative to the
        // audioContext.
        return;
      }

      // if (this.measure < 2) {
      //   divisions.start(time);
      //   return;
      // }
      // if (this.measure === 2) {
      //   divisions.start(time);
      //   return;
      // }
      // if (this.measure === 3) {
      //   divisions.start(time);
      //   return;
      // }
      let pattern = patterns[patternIndex % patterns.length];
      this.things.restart();
      pattern.start();
      patternIndex++;
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
