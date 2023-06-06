import WebSocket from 'ws';
import { InsertionService } from './InsertionService';
import { LoggerService } from './LoggerService';

enum URLs {
  'goerli' = 'wss://ws.dev.reservoir.tools',
  'mainnet' = 'wss://ws.reservoir.tools',
}

type Chains = 'mainnet' | 'goerli';
export interface AsksSchema {
  id: string;
  kind: string;
  side: string;
  status: string;
  tokenSetId: string;
  tokenSetSchemaHash: string;
  contract: string;
  maker: string;
  taker: string;
  price: AsksPrice;
  validFrom: number;
  validUntil: number;
  quantityFilled: number;
  quantityRemaining: number;
  dynamicPricing: unknown;
  criteria: AsksCriteria;
  source: AsksSource;
  feeBps: number;
  feeBreakdown: AsksFeeBreakdown[];
  expiration: number;
  isReservoir: boolean;
  isDynamic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AsksPrice {
  currency: AsksCurrency;
  amount: AsksAmount;
  netAmount: AsksNetAmount;
}

export interface AsksCurrency {
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface AsksAmount {
  raw: string;
  decimal: number;
  usd: number;
  native: number;
}

export interface AsksNetAmount {
  raw: string;
  decimal: number;
  usd: number;
  native: number;
}

export interface AsksCriteria {
  kind: string;
  data: AsksData;
}

export interface AsksCollection {
  id: string;
  name: string;
  image: string;
}
export interface AsksData {
  token: AsksToken;
  collection: AsksCollection;
}

export interface AsksToken {
  tokenId: string;
  name: string;
  image: string;
}

export interface AsksSource {
  id: string;
  domain: string;
  name: string;
  icon: string;
  url: string;
}

export interface AsksFeeBreakdown {
  bps: number;
  kind: string;
  recipient: string;
}

interface WebSocketServiceConfig {
  contracts: string[];
  apiKey: string;
  chain: Chains;
}

interface SocketError {
  name: string;
  message: string;
  stack: string;
}

export type MessageType = 'connection';

export type MessageEvent =
  | 'subscribe'
  | 'ask.created'
  | 'ask.updated'
  | 'sale.created'
  | 'sale.updated';

export interface SocketMessage {
  type: MessageType;
  event: MessageEvent;
  status: string;
  data: AsksSchema | SalesSchema;
}
export interface Collection {
  id?: string;
  name: string;
}
export interface Token {
  contract: string;
  tokenId: string;
  name?: string;
  image?: string;
  collection: Collection;
}
export interface Currency {
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
}
export interface Amount {
  raw: string;
  decimal: number;
  usd: number;
  native: number;
}
export interface Price {
  currency: Currency;
  amount: Amount;
}
export interface SalesSchema {
  id: string;
  saleId: string;
  token: Token;
  orderId: string;
  orderSource: string;
  orderSide: string;
  orderKind: string;
  from: string;
  to: string;
  amount: string;
  fillSource: string;
  block: number;
  txHash: string;
  logIndex: number;
  batchIndex: number;
  timestamp: number;
  price: Price;
  washTradingScore: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

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
  private _connect = (): void => {
    if (this._isConnected) return;

    this._ws = this._config.apiKey
      ? new WebSocket(
          `${URLs[this._config.chain]}?api_key=${this._config.apiKey}`
        )
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
      const { type, status, data, event }: SocketMessage = JSON.parse(
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
        this._connect();
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
  private _onError = (e: SocketError): void => {
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
