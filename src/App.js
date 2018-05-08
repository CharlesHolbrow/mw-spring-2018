import { Synk }  from 'synk-js';

import AppEndpoint from './AppEndpoint.js';
import Cell from './Cell.js';
import BufferCache from './BufferCache.js';
import Scroll from './scroll.js';
import ClickHandler from './ClickHandler.js';

/**
* High level Aether Application
*/
export default class App {
  /**
  * Create an App
  */
  constructor(svgParent) {
    this.outer = svgParent.parentElement; // The smaller div with scrolling
    this.svgParent = svgParent;           // The div that will be centered
    this.svgRoot = SVG(svgParent)         // the svg
      .attr('draggable', false) // I'm unsure about effects of 'draggable' attr
      .size(210, 210);

    const https = window.location.protocol.startsWith('https');
    const url =  `${https ? 'wss' : 'ws'}://${window.location.host}/ws`;
    
    this.focusChunk = {x: 0, y: 0};
    this.mapName = 'snd:a';
    this.svgCells = this.svgRoot.nested()
      .attr('draggable', false); // I'm unsure about effects of 'draggable' attr

    this.clickHandler = new ClickHandler();
    this.scroll = new Scroll(this.outer, this.svgParent);
    this.bufferCache = new BufferCache();
    this.synk = new Synk(url);
    this.endpoint = new AppEndpoint(this);

    this.scroll.panTo(0, 0);

    // All messages from the server will be passed to the endpoint. Thanks to
    // the connection object, even if we disconnect and reconnect, incoming
    // messages will still be passed through to this.endpoint.
    this.endpoint.subscribe(this.synk.connection.stream);

    // Set the default class for cell objects
    this.synk.objects.byKey.createBranch('cell').class = Cell;

    // Add The object to 
    this.synk.objects.on('add', (obj, msg) => {
      if (obj instanceof Cell) {
        obj.setBuffer(this.bufferCache.get(obj.audioPath));
        obj.setParent(this.svgCells);
        obj.svg.on('click', (event) => {
          this.clickHandler.receive(obj, event);
        });

        // Send move requests to the server
        obj.on('moved', (x, y) => {
          this.synk.connection.send({
            method: 'moveCell',
            id: obj.id,
            x: x,
            y: y,
          });
        });

        obj.output.connect(this.clickHandler.cellDistortion);
        obj.output.connect(this.clickHandler.cellClean);
      }
    });

    this.synk.objects.on('mod', (obj, msg) => {});
    this.synk.objects.on('rem', (obj, msg) => {});

    // We could replace 'close' with reconnect'
    this.synk.connection.on('close', () => {
      const sKeys = Object.keys(this.synk.objects.bySKey.branches);
      console.log(`connection close subscribed to ${sKeys.length} keys`);
    });
    this.synk.connection.on('open', () => {
      const sKeys = Object.keys(this.synk.objects.bySKey.branches);
      console.log(`connection open subscribed to ${sKeys.length} keys`);
    });
  }

  /**
   * Set the synk subscription to the area described below.
   * @param {Integer} x - coordinate of the xChunk to focus on
   * @param {Integer} y - coordinate of the yChunk to focus on
   */
  focusOnChunk(x, y) {
    this.focusChunk.x = x;
    this.focusChunk.y = y;

    var chunks = [];
    var xStart = x - 2; // inclusive
    var xEnd = x + 3;   // exclusive
    var yStart = y - 2; // inclusive
    var yEnd = y + 3;   // exclusive

    for (var cy = yStart; cy < yEnd; cy++) {
      for (var cx = xStart; cx < xEnd; cx++) {
        chunks.push(`${this.mapName}|${cx}|${cy}`);
      }
    }

    this.synk.setSubscription(chunks);
    this.synk.resolve();
  }
}
