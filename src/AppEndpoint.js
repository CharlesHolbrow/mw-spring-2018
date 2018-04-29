import { Endpoint } from 'synk-js';

/**
 * This is the main interface that receives RPCs from the server. AppEndpoint
 * must be created by an App instance in the App constructor.
 */
export default class AppEndpoint extends Endpoint {
  /**
   * @param {App} app - The aether app that we are listening to
   */
  constructor(app) {
    super();
    // Even though this doesn't do anything right now, I'm keeping it around,
    // because this is a handy place to add custom listeners.
    this.app = app;
  }
}
