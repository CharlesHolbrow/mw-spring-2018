import Tone from 'tone';

export default class BufferCache {
  constructor() {
    this.dataByUrl = {};
  }

  get(url) {
    if (this.dataByUrl.hasOwnProperty(url))
      return this.dataByUrl[url];
    
    const buffer = new Tone.Buffer(url);
    this.dataByUrl[url] = buffer;
    return buffer;
  }

  count() {
    return Object.keys(this.dataByUrl).length;
  }
}
