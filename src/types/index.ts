import { SyncWorker } from '@/services/SyncWorker copy';
import { Prisma } from '@prisma/client';
import { HttpStatusCode } from 'axios';
import { Application } from 'express';
import { SyncerWorker, SyncManager, SyncService } from '../services';

export interface Worker {
  date: string;
  continuation: string;
}

export interface Manager {
  date: string;
  workers: Worker[];
}

export interface Backup {
  type: string;
  date: string;
  managers: Manager[];
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

export type Schemas = SalesSchema[];

export type IndexSignatureType = {
  [key in Tables]: Schemas;
};

export type SyncManagerInstance = InstanceType<typeof SyncManager>;
export type SyncServiceInstance = InstanceType<typeof SyncService>;

export type RequestType = SyncServiceInstance['_request'];
export type InsertType = SyncServiceInstance['_insert'];
export type CountType = SyncServiceInstance['_count'];
export type ParseType = SyncServiceInstance['_parse'];
export type FormatType = SyncServiceInstance['_format'];
export type BackupType = SyncServiceInstance['_backup'];

export interface WorkerConfig {
  date: string;
  id: string;
  continuation: string;
  request: SyncServiceInstance['_request'];
  format: SyncServiceInstance['_format'];
  insert: SyncServiceInstance['_insert'];
  count: SyncServiceInstance['_count'];
  review: SyncManagerInstance['_reviewWorker'];
  backup: BackupType;
}
export type PrismaSalesCreate = Prisma.salesCreateInput;

export type PrismaCreate = PrismaSalesCreate & {
  isDeleted?: boolean;
};

export type Tables = 'sales';

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
}

export interface ParserMethods {
  sales: (sales: SalesSchema[], contracts?: string[]) => PrismaSalesCreate[];
}
export interface FormatMethods {
  sales: (sales: SalesSchema[]) => PrismaSalesCreate[];
}
type KnownPropertiesType = {
  continuation: string;
  cursor: string;
} & {
  [key in Tables]: Schemas;
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

export type Chains = 'mainnet' | 'goerli' | 'optimism' | 'polygon';

export interface ServerConfig {
  port?: number | string;
  authorization?: string;
}
export interface ManagerConfig {
  date: string;
  count: CountType;
  insert: InsertType;
  format: FormatType;
  parse: ParseType;
  request: RequestType;
  backup: BackupType;
  workers?: Worker[];
  workerCount: number;
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

export type Managers = Map<string, SyncManager | undefined>;
export type Workers = Map<string, SyncWorker>;
