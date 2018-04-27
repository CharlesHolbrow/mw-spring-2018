export var randomColor = function() {
  return {
    r: Math.floor(Math.random() * 127),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  };
};
  
export var dimColor = function(color) {
  return {
    r: Math.floor(color.r * 0.3),
    g: Math.floor(color.r * 0.3),
    b:  Math.floor(color.r * 0.3),
  };
};
  

export var randomColorWithBrightness = function(y) {
  var h = Math.random();
  var s = 0.5 + (Math.random() * 0.5 * y);
  var l = 0.5;

  return hslToRgb(h, s, l);
};

export var randomHslWithBrightness = function() {
  return {
    h: Math.random(),
    s: 0.25 + (0.75 * y),
    l: 0.5,
  };
};

export var twoSaturationLevels = function(hue) {
  return [
    hslToRgb(hue, 0.5, 0.5),
    hslToRgb(hue, 1.0, 0.5),
  ];
};

export var threeSaturationLevels = function(hue) {
  return [
    hslToRgb(hue, 0.2, 0.5),
    hslToRgb(hue, 0.6, 0.5),
    hslToRgb(hue, 1.0, 0.5),
  ];
};

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 */
function hslToRgb(h, s, l){
  var r, g, b;

  if (s == 0) {
      r = g = b = l; // achromatic
  } else {
      var hue2rgb = function hue2rgb(p, q, t){
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }

      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}