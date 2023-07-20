import WebSocket from 'ws';
import {
  AsksSchema,
  BidsSchema,
  MessageEvent,
  SalesSchema,
  URLs,
  WebSocketError,
  WebSocketMessage,
  WebSocketServiceConfig,
} from '../types';
import { InsertionService } from './InsertionService';
import { LoggerService } from './LoggerService';

/**
 * Class _WebSocketService provides an interface for working with WebSocket connections.
 */
class _WebSocketService {
  /**
   * @private
   * @type {WebSocket}
   */
  private _ws: WebSocket | null = null;

  /**
   * @private
   * @type {URLs}
   */
  private _url: URLs = URLs['mainnet'];

  /**
   * @private
   * @type {boolean}
   */
  private _isConnected: boolean = false;

  /**
   * @private
   * @type {WebSocketServiceConfig}
   */
  private _config: WebSocketServiceConfig = {
    contracts: [],
    apiKey: '',
    chain: null,
    toSync: {
      bids: false,
      sales: false,
      asks: false,
    },
  };

  /**
   * Configures the WebSocket service with provided configuration.
   * @param {WebSocketServiceConfig} config - WebSocket service configuration object. Defaults to this._config
   */
  public construct(config: WebSocketServiceConfig): void {
    this._config = config;
  }

  /**
   * Establishes a connection with the WebSocket.
   * @private
   */
  private _connect(): void {
    if (this._isConnected) return;

    this._ws =
      this._config.apiKey && this._config.chain
        ? new WebSocket(
            `${URLs[this._config.chain]}?api_key=${this._config.apiKey}`
          )
        : null;

    this._ws?.on('close', this._onClose.bind(this));
    this._ws?.on('error', this._onError.bind(this));
    this._ws?.on('message', this._onMessage.bind(this));
  }

  /**
   * Attempts to launch the WebSocket service.
   * @public
   * @async
   */
  public async launch(): Promise<void> {
    return new Promise((resolve) => {
      this._connect();
      const interval = setInterval(() => {
        if (this._isConnected) {
          clearInterval(interval);
          LoggerService.info(`WebSocket Service Launched`);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Subscribes to events based on provided contracts.
   * @private
   */
  private _onConnect(): void {
    if (this._config.toSync.asks) {
      this._subscribe('ask.created');
      this._subscribe('ask.updated');
    }

    if (this._config.toSync.bids) {
      this._subscribe('bid.created');
      this._subscribe('bid.updated');
    }

    if (this._config.toSync.bids) {
      this._subscribe('sale.created');
      this._subscribe('sale.updated');
    }
  }

  /**
   * Parses the message and upserts data into the InsertionService as per the event type.
   * @param {Buffer} message - WebSocket message
   * @private
   */
  private _onMessage(message: Buffer): void {
    try {
      const { type, status, data, event }: WebSocketMessage = JSON.parse(
        message.toString('utf-8')
      );

      if (event === 'subscribe') return;

      if (type === 'connection' && status === 'ready') {
        this._isConnected = true;
        this._onConnect();
        return;
      }

      this._insert(event, data);
    } catch (e: unknown) {
      LoggerService.error(e);
    }
  }

  /**
   * Upserts data based on the event type.
   * @param {string} event - Event type
   * @param {AsksSchema | BidsSchema | SalesSchema} data - Data to be upserted
   * @private
   */
  private _insert(
    event: string,
    data: AsksSchema | BidsSchema | SalesSchema
  ): void {
    if (event?.includes('ask')) {
      InsertionService.upsert('bids', [data as AsksSchema]);
    }
    if (event?.includes('bid')) {
      InsertionService.upsert('bids', [data as BidsSchema]);
    }
    if (event?.includes('sales')) {
      InsertionService.upsert('sales', [data as SalesSchema]);
    }
  }

  /**
   * Attempts reconnection every minute until successful.
   * @private
   */
  private _onClose(): void {
    this._isConnected = false;

    try {
      this._ws?.close();
      const r = setInterval(() => {
        this._connect();
        if (this._isConnected) clearInterval(r);
      }, 60000);
    } catch (e: unknown) {
      LoggerService.error(e);
    }
  }

  /**
   * Logs the error using LoggerService.
   * @param {WebSocketError} e - WebSocket error object
   * @private
   */
  private _onError(e: WebSocketError): void {
    LoggerService.error(e);
  }

  /**
   * Subscribes to websocket events.
   * @param {MessageEvent} event - The event to subscribe to
   * @param {string} contract - Contract to filter by
   * @private
   */
  private _subscribe(event: MessageEvent): void {
    this._ws?.send(
      JSON.stringify({
        type: 'subscribe',
        event,
      })
    );
  }
}

/**
 * Singleton instance of _WebSocketService.
 * @public
 */
export const WebSocketService = new _WebSocketService();
