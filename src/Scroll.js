// Logic related to scrolling behavior is below

export default class Scroll {
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
    // outer will be constrained to the size of the window. This is where
    // scrolling happens.
    this.outer = outer

    // svgParent will always be larger than outer. In the DOM flow, this is positioned
    // normally, but because of it's css `position: relative; top/left:` the svg
    // origin is moved to the center.
    //
    // Then we use JavaScript to scroll the outer object so it is centered on the
    // svg origin.
    this.svgParent = svgParent

    if (this.svgParent.parentElement !== outer) {
      console.warn('Scroll.js has ambiguous heritage');
    }

    // Where is the camera looking
    this.camera = window.camera = {x:0, y: 0};

    // In Chrome, resizing the window triggers a scroll event
    window.addEventListener('resize', function(){});

    outer.addEventListener('scroll', (event) => {
      var svgBox = this.svgParent.getBoundingClientRect();
      var outerBox = this.outer.getBoundingClientRect();

      var centerX = svgBox.width * 0.5;
      var centerY = svgBox.height * 0.5;

      centerX -= outerBox.width * 0.5;
      centerY -= outerBox.height * 0.5;

      var diffX = outer.scrollLeft - centerX;
      var diffY = outer.scrollTop - centerY;

      this.camera.x = diffX;
      this.camera.y = diffY;
      console.log('scroll event updates camera', this.camera.x, this.camera.y);
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

