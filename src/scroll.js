// Logic related to scrolling behavior is below

// outer will be constrained to the size of the window. This is where scrolling happens
var outer = window.outer = document.getElementById('outer');

// svgRoot will always be larger than outer. In the DOM flow, this is positioned
// normally, but because of it's css `position: relative; top/left:` the svg
// origin is moved to the center.
//
// Then we use JavaScript to scroll the outer object so it is centered on the
// svg origin.
var svgRoot = window.svgRoot = document.getElementById('svg-root');

// Where is the camera looking
var camera = window.camera = {x:0, y: 0};

var panTo = window.panTo = function(x, y) {
  var svgBox = svgRoot.getBoundingClientRect();
  var outerBox = outer.getBoundingClientRect();

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
  outer.scrollTo(scrollX, scrollY);
};

// In Chrome, resizing the window triggers a scroll event
window.addEventListener('resize', function(){});

outer.addEventListener('scroll', function(event){
  var svgBox = svgRoot.getBoundingClientRect();
  var outerBox = outer.getBoundingClientRect();

  var centerX = svgBox.width * 0.5;
  var centerY = svgBox.height * 0.5;

  centerX -= outerBox.width * 0.5;
  centerY -= outerBox.height * 0.5;

  var diffX = outer.scrollLeft - centerX;
  var diffY = outer.scrollTop - centerY;

  camera.x = diffX;
  camera.y = diffY;
  console.log('scroll event updates camera');
});

panTo(0, 0);