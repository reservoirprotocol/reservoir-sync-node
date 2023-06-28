/**
 * TYPES & ENUMS
 */

import { HttpStatusCode } from 'axios';
import { Application } from 'express';

export enum URLs {
  'goerli' = 'wss://ws.dev.reservoir.tools',
  'mainnet' = 'wss://ws.reservoir.tools',
}

export type KnownPropertiesType = {
  continuation: string;
  records: Schemas;
} & {
  [key in 'sales' | 'orders']: Schemas;
};

export type GenericResponse = KnownPropertiesType;

export type ErrorType = {
  status: number;
  error: string;
  message: string;
};

export type SuccessType = KnownPropertiesType;

export type SuccessResponse<T = SuccessType> = {
  data: T;
  status: HttpStatusCode;
};

export type ErrorResponse<T = ErrorType | null> = {
  data: T;
  status: HttpStatusCode | null;
};

export type ApiResponse<T = SuccessType> = SuccessResponse<T> | ErrorResponse;

export type GraphQlServiceConfig = InsertionServiceConfig;

export type DataTypes = 'sales' | 'asks';

export type DataSets = AsksSchema[] | SalesSchema[];

export type Chains = 'mainnet' | 'goerli';

export type MessageType = 'connection';

export type MessageEvent =
  | 'subscribe'
  | 'ask.created'
  | 'ask.updated'
  | 'sale.created'
  | 'sale.updated';

export type Mode = 'slow' | 'normal' | 'fast';

/**
 * INTERFACES
 */

/**
 * API KEY - Reservoir api key
 * DATA MAPPING - Mapping for custom tables
 * CHAIN - Chain to sync
 * CONTRACTS - Specific contracts to filter by
 * ENABLE WEBSOCKETS - Boolean to enable websockets or not
 * DELAY - Delay when upkeeping
 * SYNC MODE - Upkeeping or backfilling
 * MODE - Mode that determines the count of the worker pool
 */

export interface Mapping {
  datasets: DataTypes[];
  type: {
    root: 'sales' | 'orders';
    dataset: 'sales' | 'asks';
  };
  table: string;
}
export interface ControllerConfig {
  apiKey: string;
  mapping: Mapping;
  chain: Chains;
  contracts: string[];
  delay: number;
  mode: Mode;
}

export interface QueueEvent {
  type: 'new.block';
  block: Block;
}

export interface ControllerEvent {
  type: string;
  data: {
    block: Block;
  };
}

export interface Timestamps {
  startTimestamp: number;
  endTimestamp: number;
}

export interface Path {
  handlers: Application;
  path: string;
}

export interface Block {
  id: string;
  startDate: string;
  endDate: string;
  contract: string;
  mapping: Mapping;
}

export interface WebSocketMessage {
  type: MessageType;
  event: MessageEvent;
  status: string;
  data: AsksSchema | SalesSchema;
}

export interface WebSocketError {
  name: string;
  message: string;
  stack: string;
}

export interface WebSocketServiceConfig {
  contracts: string[];
  apiKey: string;
  chain: Chains;
}

export interface LoggerServiceConfig {
  datadog: {
    apiKey: string;
    appName: string;
  };
}

export interface ServerConfig {
  port: number;
  authorization: string;
}

export type Schemas = SalesSchema[] | AsksSchema[];

export type SchemasObject = {
  sales: SalesSchema[];
  asks: AsksSchema[];
};

export interface InsertionServiceConfig {
  mappings: {
    datasets: DataTypes[];
    table: string;
  }[];
}

export interface SyncNodeConfig {
  server: {
    port: number;
    authorization: string;
  };
  syncer: {
    apiKey: string;
    chain: Chains;
    mappings: {
      datasets: DataTypes[];
      table: string;
      contracts: string[];
    }[];
  };
  logger: {
    datadog: {
      apiKey: string;
      appName: string;
    };
  };
}

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
  price: {
    currency: {
      contract: string;
      name: string;
      symbol: string;
      decimals: number;
    };
    amount: {
      raw: string;
      decimal: number;
      usd: number;
      native: number;
    };
    netAmount: {
      raw: string;
      decimal: number;
      usd: number;
      native: number;
    };
  };
  validFrom: number;
  validUntil: number;
  quantityFilled: number;
  quantityRemaining: number;
  dynamicPricing: unknown;
  criteria: {
    kind: string;
    data: {
      token: {
        tokenId: string;
        name: string;
        image: string;
      };
      collection: {
        id: string;
        name: string;
        image: string;
      };
    };
  };
  source: {
    id: string;
    domain: string;
    name: string;
    icon: string;
    url: string;
  };
  feeBps: number;
  feeBreakdown: {
    bps: number;
    kind: string;
    recipient: string;
  }[];
  expiration: number;
  isReservoir: boolean;
  isDynamic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalesSchema {
  id: string;
  saleId: string;
  token: {
    contract: string;
    tokenId: string;
    name?: string;
    image?: string;
    collection: { id: string; name: string };
  };
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
  price: {
    currency: {
      contract: string;
      name: string;
      symbol: string;
      decimals: number;
    };
    amount: {
      raw: string;
      decimal: number;
      usd: number;
      native: number;
    };
  };
  washTradingScore: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}
