import WebSocket from 'ws';
import {
  AsksSchema,
  BidsSchema,
  MessageEvent,
  SalesSchema,
  URLs,
  WebSocketError,
  WebSocketMessage,
  WebSocketServiceConfig
} from '../types';
import { InsertionService } from './InsertionService';
import { LoggerService } from './LoggerService';

/**
 * The _WebSocketService class provides an interface to interact with websockets.
 * It provides methods for opening and closing a connection, as well as for subscribing to various events.
 * It utilizes the InsertionService and LoggerService classes.
 */
class _WebSocketService {
  /**
   * WebSocket connection
   * @access private
   * @type {WebSocket}
   */
  private _ws: WebSocket | null = null;

  /**
   * WebSocket url
   * @access private
   * @type {URLs}
   */
  private _url: URLs = URLs['mainnet'];

  /**
   * Connection flag for the websocket
   * @access private
   * @type {boolean}
   */
  private _isConnected: boolean = false;

  /**
   * Configuration for the WebSocket service
   * @access private
   * @type {WebSocketServiceConfig}
   */
  private _config: WebSocketServiceConfig = {
    contracts: [],
    apiKey: '',
    chain: null,
  };

  /**
   * Attempts to establish a connection to the WebSocket.
   * @param {WebSocketServiceConfig} config - WebSocket service configuration object. Defaults to this._config
   * @returns {void}
   */
  public construct = (config: WebSocketServiceConfig): void => {
    this._config = config;
  };

  /**
   * Attempts to create a connection to the WebSocket
   * @returns void
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
   * Launches the WebSocketService
   * @returns void
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
   * Callback function for WebSocket connection.
   * Subscribes to events based on provided contracts.
   * @returns {void}
   */
  private _onConnect = (): void => {
    if (this._config.contracts && this._config.contracts.length > 0) {
      this._config.contracts.forEach((contract) => {
        this._subscribe('ask.created', contract);
        this._subscribe('ask.updated', contract);
        this._subscribe('sale.created', contract);
        this._subscribe('sale.updated', contract);
      });
      return;
    }

    this._subscribe('ask.created');
    this._subscribe('ask.updated');
    this._subscribe('sale.created');
    this._subscribe('sale.updated');
  };

  /**
   * Callback function for WebSocket messages.
   * Parses the message and upserts data into the InsertionService as per the event type.
   * @param {Buffer} message - WebSocket message
   * @returns {void}
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

      if (event?.includes('bid')) {
        InsertionService.upsert('bids', [data as BidsSchema]);
      }

      if (event?.includes('ask')) {
        InsertionService.upsert('asks', [data as AsksSchema]);
      }

      if (event?.includes('sales')) {
        InsertionService.upsert('sales', [data as SalesSchema]);
      }
    } catch (e: unknown) {
      LoggerService.error(e);
    }
  }

  /**
   * Callback function for WebSocket closure.
   * Attempts reconnection every minute until successful.
   * @returns {void}
   */
  private _onClose = (): void => {
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
  };

  /**
   * Callback function for WebSocket errors.
   * Logs the error using LoggerService.
   * @param {WebSocketError} e - WebSocket error object
   * @returns {void}
   */
  private _onError = (e: WebSocketError): void => {
    LoggerService.error(e);
  };

  /**
   * Subscribes to websocket events
   * @param {MessageEvent} event - The event to subscribe to
   * @param {string} contract - Contract to filter by
   * @returns {void}
   */
  private _subscribe = (event: MessageEvent, contract?: string): void => {
    this._ws?.send(
      JSON.stringify({
        type: 'subscribe',
        event,
        ...(contract && { contract }),
      })
    );
  };
}

/**
 * The WebSocketService is an instance of the _WebSocketService class,
 * allowing for singleton-like usage throughout the application.
 */
export const WebSocketService = new _WebSocketService();
