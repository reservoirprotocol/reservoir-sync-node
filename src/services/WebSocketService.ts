import EventEmitter from 'events';
import WebSocket from 'ws';

class _WebSocketService extends EventEmitter {
  /**
   * # _ws
   * WebSocket connection
   * @access private
   */
  private _ws: WebSocket | null = new WebSocket(``);

  constructor() {
    super();
  }

  /**
   * # set
   * @access public
   * @returns void
   */
  public set(): void {}
}

const WebSocketService = new _WebSocketService();
