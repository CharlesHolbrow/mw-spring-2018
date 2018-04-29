import { Synk }  from 'synk-js';

import Cell from './Cell.js';
import AppEndpoint from './AppEndpoint.js';

/**
* High level Aether Application
*/
export default class App {
  /**
  * Create an App
  */
  constructor(svgParent) {
    const https = window.location.protocol.startsWith('https');
    const url =  `${https ? 'wss' : 'ws'}://${window.location.host}/ws`;
    
    const temporaryUrl = 'ws://localhost:5000/ws';
    this.svgParent = svgParent;

    this.synk = new Synk(temporaryUrl);
    this.endpoint = new AppEndpoint(this);

    // All messages from the server will be passed to the endpoint. Thanks to
    // the connection object, even if we disconnect and reconnect, incoming
    // messages will still be passed through to this.endpoint.
    this.endpoint.subscribe(this.synk.connection.stream);

    // Set the default class for Characters
    this.synk.objects.byKey.createBranch('cell').class = Cell;

    // Add The object to 
    this.synk.objects.on('add', (obj, msg) => {
      if (obj instanceof Cell) {
        obj.setParent(svgParent);
      }
    });
    this.synk.objects.on('mod', (obj, msg) => {});
    this.synk.objects.on('rem', (obj, msg) => {});

    // We could replace 'close' with reconnect'
    this.synk.connection.on('close', () => {
      console.log('connection close bySKey.branches:', Object.keys(this.synk.objects.bySKey.branches));
    });
    this.synk.connection.on('open', () => {
      console.log('connection open bySKey.branches: ', Object.keys(this.synk.objects.bySKey.branches));
    });
  }
}
