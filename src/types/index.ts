import { SyncService } from '@/services/SyncService';
import { SyncWorker } from '@/services/SyncWorker';
import { Prisma } from '@prisma/client';
import { HttpStatusCode } from 'axios';
import { Application } from 'express';
import { SyncManager } from '../services';

export interface ContractInfo {
  name: string;
}
export interface WorkerBackup {
  date: string;
  continuation: string;
}

export interface ManagerBackup {
  date: string;
  workers: WorkerBackup[];
}

export interface Backup {
  type: string;
  data: {
    date: string;
    managers: ManagerBackup[];
  };
}

export interface Counts {
  insertions: number;
  _insertions: number;
  _requests: {
    '2xx': 0;
    '4xx': 0;
    '5xx': 0;
  };
  requests: {
    '2xx': 0;
    '4xx': 0;
    '5xx': 0;
  };
}

export type Status = 'backfilling' | 'upkeeping';

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

export type Schemas = SalesSchema[] | AsksSchema[] | BidsSchema[];

export type SchemasObject = {
  sales: SalesSchema[];
  asks: AsksSchema[];
};

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
  price: AsksPrice;
  validFrom: number;
  validUntil: number;
  quantityFilled: number;
  quantityRemaining: number;
  dynamicPricing: any;
  criteria: AsksCriteria;
  source: AsksSource;
  feeBps: number;
  feeBreakdown: AsksFeeBreakdown[];
  expiration: number;
  isReservoir: any;
  isDynamic: boolean;
  createdAt: string;
  updatedAt: string;
}
export type IndexSignatureType = {
  sales: SalesSchema[];
  orders: AsksSchema[] | BidsSchema[];
};

export type SyncManagerInstance = InstanceType<typeof SyncManager>;
export type SyncServiceInstance = InstanceType<typeof SyncService>;

export type RequestType = SyncServiceInstance['_request'];
export type InsertType = SyncServiceInstance['_insert'];
export type CountType = SyncServiceInstance['_count'];
export type ParseType = SyncServiceInstance['_parse'];
export type FormatType = SyncServiceInstance['_format'];
export type BackupType = SyncServiceInstance['_backup'];
export type ReviewType = SyncServiceInstance['_reviewManager'];

export interface WorkerConfig {
  date: string;
  id: string;
  type: Tables;
  continuation: string;
  request: SyncServiceInstance['_request'];
  format: SyncServiceInstance['_format'];
  insert: SyncServiceInstance['_insert'];
  count: SyncServiceInstance['_count'];
  review: SyncManagerInstance['_reviewWorker'];
  backup: BackupType;
}
export type PrismaSalesCreate = Prisma.salesCreateInput;
export type PrismaAsksCreate = Prisma.asksCreateInput;

export type PrismaCreate = PrismaSalesCreate & {
  isDeleted?: boolean;
};
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
  dynamicPricing: any;
  criteria: AsksCriteria;
  source: AsksSource;
  feeBps: number;
  feeBreakdown: AsksFeeBreakdown[];
  expiration: number;
  isReservoir: any;
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

export type Tables = 'sales' | 'asks';

export type RecordRoots = {
  sales: 'sales';
  asks: 'orders';
};

export interface Delete {
  table: Tables;
  ids: Buffer[];
}

export interface Query {
  table: Tables;
  data: PrismaCreate[];
}
export interface Bases {
  mainnet: string;
  goerli: string;
  optimism: string;
  polygon: string;
}

export interface Paths {
  sales: string;
  asks: string;
  bids: string;
}
export interface PrismaStatus {
  error?: unknown;
  count: number;
}

export interface RequestMethods {
  sales: ({
    url,
    query,
    apiKey,
  }: {
    url: string;
    query: string;
    apiKey: string;
  }) => Promise<ApiResponse>;
  asks: ({
    url,
    query,
    apiKey,
  }: {
    url: string;
    query: string;
    apiKey: string;
  }) => Promise<ApiResponse>;
}

export type ParserRaw<T> = {
  sales: any;
  asks: any;
};
export type ParserFormatted = {
  sales: any;
  asks: any;
};

// export type ParserMethods = {
//   sales: (sales: SalesSchema[], contracts?: string[]) => PrismaSalesCreate[];
//   asks: (asks: AsksSchema[], contracts?: string[]) => PrismaAsksCreate[];
// };

export type ParserMethods = {
  [K in 'sales' | 'asks']: K extends 'sales'
    ? (sales: SalesSchema[], contracts?: string[]) => PrismaSalesCreate[]
    : (asks: AsksSchema[], contracts?: string[]) => PrismaAsksCreate[];
};

export type DataType<T extends keyof ParserMethods> = ParserMethods[T] extends (
  data: infer D,
  contracts?: string[]
) => any
  ? D
  : never;

export interface ParserRawData<T> {
  sales: SalesSchema;
  asks: AsksSchema;
}

export interface FormatMethods {
  sales: (sales: SalesSchema[]) => PrismaSalesCreate[];
  asks: (asks: AsksSchema[]) => PrismaAsksCreate[];
}
export type APIDatasets = 'sales' | 'orders';

// continatuon
// orders | sales
export type KnownPropertiesType = {
  continuation: string;
} & {
  [key in APIDatasets]: Schemas;
};

export interface Request {
  continuation: string;
  date: string;
}

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

export type ErrorResponse<T = ErrorType> = {
  data: T;
  status: HttpStatusCode;
};

export type ApiResponse<T = SuccessType> = SuccessResponse<T> | ErrorResponse;

export type Chain = keyof Chains;

export type Chains = 'mainnet' | 'goerli';

export interface ServerConfig {
  port?: number | string;
  authorization?: string;
}
export interface ManagerConfig {
  id: string;
  date: string;
  delay: number;
  count: CountType;
  insert: InsertType;
  format: FormatType;
  parse: ParseType;
  review: ReviewType;
  request: RequestType;
  backup: BackupType;
  workers?: WorkerBackup[];
  workerCount: number;
  type: Tables;
}
export interface DatadogConfig {
  appName?: string;
  apiKey?: string;
}
export interface LoggerConfig {
  datadog?: DatadogConfig;
}
export interface ToSync {
  sales: boolean;
  asks: boolean;
}
export interface BaseSyncerConfig {
  apiKey: string;
  chain: Chains;
  contracts?: string[];
  workerCount?: string;
  managerCount?: string;
}
export interface SyncerConfig extends BaseSyncerConfig {
  date: string;
  delay: number;
  type: Tables;
  backup: Backup | null;
}
export interface LightNodeSyncerConfig extends BaseSyncerConfig {
  apiKey: string;
  chain: Chains;
  contracts?: string[];
  workerCount?: string;
  managerCount?: string;
  toSync: ToSync;
}

export interface BackupConfig {
  redisUrl?: string;
  useBackup?: boolean;
}
export interface LightNodeConfig {
  server: ServerConfig;
  logger?: LoggerConfig;
  backup?: BackupConfig;
  syncer: LightNodeSyncerConfig;
}

export interface Path {
  handlers: Application;
  path: string;
}

export type Managers = Map<string, SyncManager>;
export type Workers = Map<string, SyncWorker>;
