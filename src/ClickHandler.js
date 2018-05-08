import Tone from 'tone';

class Things {
  constructor() {
    this.index = 0;
    this.data = [];
    this.offsetRandomRange = 0.7;
    this.offset = 0;
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
      const offset = this.offset + (Math.random() * this.offsetRandomRange);
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

    // All audio from cells will be routed here
    this.cellMaster = new Tone.Gain().toMaster();
    // this.input1 = new Tone.Gain(1).connect(this.cellMaster);
    // this.input2 = new Tone.Gain(0).connect(this.cellMaster);

    this.left = new Tone.Panner(-1).toMaster();
    this.right = new Tone.Panner(1).toMaster();

    this.cfl = new Tone.CrossFade(0).connect(this.left);
    this.cfr = new Tone.CrossFade(0).connect(this.right);

    this.cellClean = new Tone.Gain()
      .connect(this.cfl, 0, 0)
      .connect(this.cfr, 1, 0);

    this.cellDistortion = new Tone.Distortion(0.2)
      .connect(this.cfl, 0, 1)
      .connect(this.cfr, 1, 1);

    // Sampler is meant for creating instruments, but here I'm just using it for
    // polyphonic playback of multiple files.
    const samplerData = {
      45: "sound/g-3rd-s/01-A2-min-003-stretch.mp3",
      47: "sound/g-3rd-s/02-B2-min-004-stretch.mp3",
      48: "sound/g-3rd-s/03-C3-maj-004-stretch.mp3",
      50: "sound/g-3rd-s/04-D3-maj-004-stretch.mp3",
      52: "sound/g-3rd-s/05-E3-min-005-stretch.mp3",
      54: "sound/g-3rd-s/06-Fs3-min-005-stretch.mp3",
      55: "sound/g-3rd-s/07-G3-maj-002-stretch.mp3",
      57: "sound/g-3rd-s/08-A3-min-004-stretch.mp3",
    };
    this.samplerGain = new Tone.Gain(Tone.dbToGain(-3)).toMaster(); // sampler.volume is broken?
    this.sampler = new Tone.Sampler(samplerData, () => {
      console.log('clickHandler.synth ready');
    }).connect(this.samplerGain);

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
      this.level = Math.min(this.level, 20);

      console.log('level:', this.level);

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

      

      // don't reset until we get to level 4
      if (this.level >= 4) this.things.restart();

      if (this.level > 16) {
        const dist = this.level - 16; // 1, 2, 3, 4
        this.distortion = Math.min(Math.max(dist * 0.25, 0), 1);
      } else {
        this.distortion = 0;
      }

      if (this.level >= 17 && this.level <= 19){
        this.things.offset = 0.5;
        this.things.offsetRandomRange = 0.7;
      } else {
        // default
        this.things.offset = 0;
        this.things.offsetRandomRange = 0.7;
      }

      // Get the pattern we want to play
      pattern = divs[Math.min(this.level, divs.length - 1)];
      // save a reference to the first 'thing' in the pattern
      const firstThing = this.things.get();
      // if we got the pattern, play it
      if (pattern) {
        pattern.stop().start();

        // play the sampler, maybe
        if (firstThing && typeof firstThing.object.midiNote === 'number') {
          const firstMidi = firstThing.object.midiNote;
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

  set distortion(value) {
    this.cfl.fade.rampTo(value, 1);
    this.cfr.fade.rampTo(value, 1);
  }
}
