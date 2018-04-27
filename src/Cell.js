import { threeSaturationLevels } from './colors.js';



export default class Cell {
  constructor(parent, ops){

    this.hue = typeof ops.hue === 'number' ? ops.hue : Math.random();
    this.size = typeof ops.size === 'number' ? ops.size : 100;
    this.radius = typeof ops.radius === 'number' ? ops.radius : 10;


    this.colors = threeSaturationLevels(this.hue)
    this.gradient = main.gradient('radial', (stop) => {
      stop.at(0.0, this.colors[2], 1.0);
      stop.at(1.0, this.colors[0], 1.0);
    }).radius(0.5);

    this.svg = parent
      .rect(this.size, this.size)
      .radius(this.radius)
      .fill(this.gradient);
  }

  x(value) {
    return this.svg.x(value);
  }

  y(value) {
    return this.svg.y(value);
  }
}