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
}

export default class ClickHandler {

  constructor() {
    this.things = new Things();
    this.noteLength = new Tone.Time('16n');

    const iter = (time, event) => {
      const thing = this.things.advance().get();
      if (thing) thing.object.play(time, 0, this.noteLength);
    };

    const loop = new Tone.Loop(iter, '16n');
    loop.start();
  
    Tone.Transport.start();
  }

  receive(clicked, event) {
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
