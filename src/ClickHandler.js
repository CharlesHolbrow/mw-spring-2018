import Tone from 'tone';

class Sequence {
  constructor() {
    this.clear();
  }

  /**
   * advance the pointer, and return the newly appointed object
   */
  next() {
    return this.data[this.index++ % this.data.length] || null;
  }

  /**
  * Get current object (do not advance index)
  */
  current() {
    return this.data[this.index % this.data.length];
  }

  push(thing) {
    this.data.push(thing);
  }

  clear() {
    this.data = [];
    this.index = -1;
  }

}

export default class ClickHandler {

  constructor() {
    this.seq = new Sequence();
    this.loop = new Tone.Loop((time) => {
      const thing = this.seq.next();
      if (!thing) {
        return;
      }      
      thing.object.play(time, 0, '16n');

    }, '16n');

    this.loop.start('+0.1');

    Tone.Transport.start();
  }

  receive(clicked, event) {
    const currentThing = this.seq.current();
    const thing = {
      object: clicked,
      event: event,
      time: event.timeStamp,
      distance: Number.MAX_SAFE_INTEGER,
      deltaTime: Number.MAX_VALUE,
    }

    if (currentThing) {
      const dx = clicked.x - currentThing.object.x;
      const dy = clicked.y - currentThing.object.y;
      thing.distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
      thing.deltaTime = thing.time - currentThing.time;
    }

    if (thing.distance >= 3) {
      this.seq.clear();
    }

    this.seq.push(thing);
    console.log(thing.deltaTime)
  }

  play() {

  }

}
