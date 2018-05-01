import EventEmitter from 'eventemitter3';

const chunkSize = 400;
const split = window.split = (i) => {
  var chunk, pixel;
  if (i < 0) {
    chunk = Math.floor(i / chunkSize);
    pixel = (i + Math.abs(chunk) * chunkSize) % chunkSize
  } else {
    chunk = Math.floor(i / chunkSize);
    pixel = i % chunkSize;
  }
  return [chunk, pixel];
};

/**
 * Manages logic for infinite scroll.
 */
export default class Scroll extends EventEmitter {
  /**
   * Assumes the structure
   * - outer
   *   - svgParent
   *     - svgRoot
   *
   * @param {DOMNode} outer - outer will be constrained to the size of the
   *        window. This is where scrolling happens
   * @param {DOMNode} svgParent  - larger than "outer", position: relative within
   *        outer.
   */
  constructor(outer, svgParent) {
    super();
    // outer will be constrained to the size of the window. This is where
    // scrolling happens.
    this.outer = outer;

    // svgParent will always be larger than outer. In the DOM flow, this is positioned
    // normally, but because of its css `position: relative; top/left:` the svg
    // origin is moved to the center.
    //
    // Then we use JavaScript to scroll the outer object so it is centered on the
    // svg origin.
    this.svgParent = svgParent;

    if (this.svgParent.parentElement !== outer) {
      console.warn('Scroll.js has ambiguous heritage');
    }

    // Where is the camera looking relative to the center of the div? Pixel and
    // chunk position will jump erratically as we pan across chunks.
    this.pixel = {x: 0, y: 0};
    this.chunk = {x: 0, y: 0};

    // How much to offset our content? Always a multiple of chunkSize.
    this.offset = {x: 0, y: 0};
    // Effectively, this is the pixel that we are looking at.
    this.camera = {x: 0, y: 0};

    // In Chrome, resizing the window triggers a scroll event
    window.addEventListener('resize', function(){});

    outer.addEventListener('scroll', (event) => {
      // calculate the position of the DOM scroll
      var svgBox = this.svgParent.getBoundingClientRect();
      var outerBox = this.outer.getBoundingClientRect();

      var centerX = (svgBox.width * 0.5) - (outerBox.width * 0.5);
      var centerY = (svgBox.height * 0.5) - (outerBox.height * 0.5);

      const x = this.outer.scrollLeft - centerX;
      const y = this.outer.scrollTop - centerY;

      const [chunkX, pixelX] = split(x);
      const [chunkY, pixelY] = split(y);

      this.chunk.x = chunkX;
      this.chunk.y = chunkY;
      this.pixel.x = pixelX;
      this.pixel.y = pixelY;

      if (chunkX !== 0) {
        const offsetX = chunkSize * chunkX;
        this.outer.scrollLeft += offsetX * -1;
        this.offset.x += offsetX;
      }

      if (chunkY !== 0) {
        const offsetY = chunkSize * chunkY;
        this.outer.scrollTop += (offsetY * -1)
        this.offset.y += offsetY;
      }

      this.camera.x = this.offset.x + this.pixel.x;
      this.camera.y = this.offset.y + this.pixel.y;

      console.log('scroll', x, y, this.offset, this.camera);
    });
  }

  panTo(x, y) {
    var svgBox = this.svgParent.getBoundingClientRect();
    var outerBox = this.outer.getBoundingClientRect();

    // Panning to scrollXY will put svg origin in the upper left of 'outer'
    var scrollX = svgBox.width * 0.5;
    var scrollY = svgBox.height * 0.5;

    // Move the svg origin to the center of the screen
    scrollX -= (outerBox.width * 0.5);
    scrollY -= (outerBox.height * 0.5);

    // Then adjust the camera
    scrollX += x;
    scrollY += y;

    // This will trigger a scroll event, which will update the camera variable
    this.outer.scrollTo(scrollX, scrollY);
  };
}

