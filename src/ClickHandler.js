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
    const a = new Array(divisions).fill(undefined).map((v, i) => i);
    const length = (new Tone.Time('1m') / divisions);

    const seq = new Tone.Loop((time, value) => {
      const thing = this.get();
      console.log('play:', value, time)
      if (thing) thing.object.play(time, 0, length + .15);
      this.advance();
    }, length);

    seq.iterations = divisions;
    return seq;
  }
}


export default class ClickHandler {

  constructor() {
    this.started = false;
    this.things = new Things();
    this.measure = -1;

    const sixteenths = this.things.sixteenths();
    const melodies = [];
    for (let i = 0; i <= 16; i++) {
      melodies.push(this.things.divisions(i));
    }


    let todo = false;
    this.control = Tone.Transport.scheduleRepeat((time, event) => {
      this.measure++;
      console.log('measure:', this.measure);

      const melody = melodies[this.measure];
      if (melody) {
        melody.start(time);
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

      todo = !todo;
      if (todo)
        melodies[2].start(time);
      else
        sixteenths.start(time);
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
