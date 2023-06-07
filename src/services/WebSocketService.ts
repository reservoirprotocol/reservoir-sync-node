import WebSocket from 'ws';
import {
  AsksSchema,
  MessageEvent,
  SalesSchema,
  URLs,
  WebSocketError,
  WebSocketMessage,
  WebSocketServiceConfig,
} from '../types';
import { InsertionService } from './InsertionService';
import { LoggerService } from './LoggerService';

class _WebSocketService {
  /**
   * # _ws
   * WebSocket connection
   * @access private
   */
  private _ws: WebSocket | null = null;
  /**
   * # _url
   * WebSocket url
   * @access private
   */
  private _url: URLs = URLs['mainnet'];

  /**
   * # _isConnected
   * Connection flag for the websocket
   * @access private
   */
  private _isConnected: boolean = false;

  private _config: WebSocketServiceConfig = {
    contracts: [],
    apiKey: '',
    chain: 'mainnet',
  };

  /**
   * Attempts to connect the websocket
   * @returns void
   */
  public construct = (config: WebSocketServiceConfig = this._config): void => {
    if (this._isConnected) return;

    this._ws = config.apiKey
      ? new WebSocket(`${URLs[config.chain]}?api_key=${config.apiKey}`)
      : null;

    this._ws?.on('close', this._onClose.bind(this));
    this._ws?.on('error', this._onError.bind(this));
    this._ws?.on('message', this._onMessage.bind(this));
  };

  /**
   * OnConnect callback for WebSocket
   * @returns void
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
   * # _onMessage
   * Callback binded to WebSocket message event
   * @param {Buffer} message - WebSocket message
   * @returns void
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
   * Onclose callback for WebSocket
   * @returns void
   */
  private _onClose = (): void => {
    this._isConnected = false;

    try {
      this._ws?.close();
      const r = setInterval(() => {
        this.construct();
        if (this._isConnected) clearInterval(r);
      }, 60000);
    } catch (e: unknown) {
      LoggerService.error(e);
    }
  };
  /**
   * Callback for WebSocket errors
   * @param e SocketError
   * @returns void
   */
  private _onError = (e: WebSocketError): void => {
    LoggerService.error(e);
  };
  /**
   * Subscribes to websocket events
   * @param event MessageEvent
   * @param contract contract to filter by
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

export const WebSocketService = new _WebSocketService();
