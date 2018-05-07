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
    this.level = 0; // game level (not volume)

    // Sampler is meant for creating instruments, but here I'm just using it for
    // polyphonic playback of multiple files.
    const samplerData = {
      45: "sound/g-3rd-s/01-A2-min-003-stretch.wav",
      47: "sound/g-3rd-s/02-B2-min-004-stretch.wav",
      48: "sound/g-3rd-s/03-C3-maj-004-stretch.wav",
      50: "sound/g-3rd-s/04-D3-maj-004-stretch.wav",
      52: "sound/g-3rd-s/05-E3-min-005-stretch.wav",
      54: "sound/g-3rd-s/06-Fs3-min-005-stretch.wav",
      55: "sound/g-3rd-s/07-G3-maj-002-stretch.wav",
      57: "sound/g-3rd-s/08-A3-min-004-stretch.wav",
    };
    this.sampler = new Tone.Sampler(samplerData, () => {
      console.log('clickHandler.synth ready');
    }).toMaster();

    // Offset divs, so that the index is equal to the divisions
    const divs = window.melodies = [null];
    for (let i = 1; i <= 16; i++) {
      divs.push(this.things.divisions(i));
    }
    divs[0] = divs[1];

    let pattern;
    let goingUp = true;
    let count = -1;
    this.control = Tone.Transport.scheduleRepeat((time, event) => {
      // You can't use `time` here, because loop.start expects times
      // relative to the transport, while 'time' is relative to the
      // audioContext.

      count++

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

      this.things.fadeIn = fadeIn;

      this.level = Math.min(this.level, divs.length -1);

      // don't reset until we get to level 4
      if (this.level >=4) this.things.restart();

      // Get the pattern we want to play
      pattern = divs[this.level];
      // save a reference to the first 'thing' in the pattern
      const firstThing = this.things.get();
      // if we got the pattern, play it
      if (pattern) {
        pattern.stop().start();

        // play the sampler, maybe
        if (firstThing && typeof firstThing.object.midiNote === 'number') {
          const firstMidi = firstThing.object.midiNote;
          console.log('firstMidi', firstMidi);
          if ((count % 4 === 0)
            && (Math.floor(count / 16) % 2) // Flip every 16 measures
            &&  samplerData.hasOwnProperty(firstMidi)
            && this.sampler.loaded) {
            this.sampler.triggerAttackRelease(Tone.Frequency(firstMidi, 'midi'), 24);
          }
        }
      } // close `if (pattern)`
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
