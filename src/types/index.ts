/**
 * TYPES & ENUMS
 */

import { HttpStatusCode } from "axios";
import { Application } from "express";

export enum URLs {
  "mainnet" = "wss://ws.reservoir.tools",
  "goerli" = "wss://ws-goerli.reservoir.tools",
  "polygon" = "wss://ws-polygon.reservoir.tools",
  "arbitrum" = "wss://ws-arbitrum.reservoir.tools",
  "sepolia" = "wss://ws-sepolia.reservoir.tools",
  "optimism" = "wss://ws-optimism.reservoir.tools",
}

export type KnownPropertiesType = {
  continuation: string;
  records: Schemas;
} & {
  [key in "sales" | "orders" | "transfers"]: Schemas;
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

export type WorkerType = "backfiller" | "upkeeper";

export type ApiResponse<T = SuccessType> = SuccessResponse<T> | ErrorResponse;

export type DataTypes = "sales" | "asks" | "bids" | "transfers";

export type DataSets =
  | AsksSchema[]
  | SalesSchema[]
  | BidsSchema[]
  | TransfersSchema[];

export type Chains =
  | "mainnet"
  | "goerli"
  | "polygon"
  | "arbitrum"
  | "optimism"
  | "sepolia";

export type MessageType = "connection";

export type MessageEvent =
  | "subscribe"
  | "ask.created"
  | "ask.updated"
  | "sale.created"
  | "sale.updated"
  | "bid.created"
  | "bid.updated"
  | "transfer.created"
  | "transfer.updated";

export type Mode = "slow" | "normal" | "fast";
export type ControllerType = "upkeep" | "backfill";
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
  table: string;
}
export interface WorkerEvent {
  type: "worker.release" | "worker.split" | "block.status" | "worker.idle";
  block: Block;
}

export interface ControllerConfig {
  apiKey: string;
  type: ControllerType;
  dataset: DataTypes;
  chain: Chains;
  delay: number;
  contracts: string[];
  mode: Mode;
}

export interface QueueEvent {
  type: "new.block";
  block: Block;
}

export interface ControllerEvent {
  type: string;
  data: {
    block: Block;
  };
}
export interface Backup {
  workers: {
    block: Block;
    continuation: string;
  }[];
  blocks: Block[];
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
  priority: 1 | 2 | 3;
  startDate: string;
  endDate: string;
  contract: string;
}

export interface WebSocketMessage {
  type: MessageType;
  event: MessageEvent;
  status: string;
  data: AsksSchema | SalesSchema | BidsSchema;
}

export interface WebSocketError {
  name: string;
  message: string;
  stack: string;
}

export interface WebSocketServiceConfig {
  contracts: string[];
  apiKey: string;
  chain: Chains | null;
  toSync: {
    transfers: boolean;
    bids: boolean;
    asks: boolean;
    sales: boolean;
  };
}

export interface LoggerServiceConfig {
  datadog: {
    apiKey: string;
    appName: string;
  };
}

export interface QueueServiceConfig {
  useBackup: boolean;
}

export interface ServerConfig {
  port: number;
  authorization: string;
}

export type Schemas =
  | SalesSchema[]
  | AsksSchema[]
  | BidsSchema[]
  | TransfersSchema[];

export type SchemasObject = {
  sales: SalesSchema[];
  asks: AsksSchema[];
  bids: BidsSchema[];
};

export interface SyncNodeConfig {
  syncer: {
    apiKey: string;
    chain: Chains;
    contracts: string[];
    sources: string[];
    toSync: Record<DataTypes, boolean>;
    mode: Mode;
  };
  backup: {
    useBackup: boolean;
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

export interface BidsSchema {
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

export interface TransfersSchema {
  id: string;
  token: {
    contract: string;
    tokenId: string;
  };
  from: string;
  to: string;
  amount: string;
  block: number;
  txHash: string;
  logIndex: number;
  batchIndex: number;
  timestamp: number;
  isDeleted: boolean;
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

export interface InsertionDataPoint {
  timestamp: string;
  recordCount: number;
}

export interface ProcessCommand {
  command: string;
  contract?: string;
  dataType?: DataTypes;
  recordCount?: number;
}
