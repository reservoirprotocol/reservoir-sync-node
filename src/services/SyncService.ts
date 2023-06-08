import axios, { isAxiosError } from 'axios';
import { uuid } from 'uuidv4';
import {
  APIDatasets,
  ApiResponse,
  AsksSchema,
  Bases,
  DataType,
  FormatMethods,
  KnownPropertiesType,
  Managers,
  ParserMethods,
  Paths,
  PrismaAsksCreate,
  PrismaCreate,
  PrismaSalesCreate,
  Request,
  RequestMethods,
  SalesSchema,
  Schemas,
  SyncerConfig,
  Tables,
} from '../types';
import {
  addressToBuffer,
  createQuery,
  getToday,
  incrementDate,
  isSameMonth,
  isValidDate,
  toBuffer,
} from '../utils';
import { BackupService } from './BackupService';
import { InsertionService } from './InsertionService';
import { SyncManager } from './SyncManager';

/*
 * The URL paths for the sync APIs
 */
export const URL_PATHS: Paths = {
  sales: '/sales/v4',
  asks: '/orders/asks/v4', // resolves to orders
  bids: '', // resolves to orders
};

export const RECORD_ROOT: Record<Tables, APIDatasets> = {
  sales: 'sales',
  asks: 'orders',
};

/**
 * The URL bases for the sync APIs
 */
export const URL_BASES: Bases = {
  mainnet: 'https://api.reservoir.tools',
  goerli: 'https://api-goerli.reservoir.tools',
  optimism: 'https://api-optimism.reservoir.tools',
  polygon: 'https://api-polygon.reservoir.tools',
};
/**
 * Formatting methods for the raw API responses
 */
export const FORMAT_METHODS: FormatMethods = {
  sales: (sales: SalesSchema[]) => {
    if (!sales) return [];
    return sales?.map((sale: SalesSchema) => {
      return {
        id: Buffer.from(`${sale.txHash}-${sale.logIndex}-${sale.batchIndex}`),
        sale_id: toBuffer(sale.saleId),
        token_id: sale.token.tokenId,
        contract_id: addressToBuffer(sale.token.contract),
        order_id: addressToBuffer(sale.orderId),
        order_source: sale.orderSource,
        order_side: sale.orderSide,
        order_kind: sale.orderKind,
        amount: sale.amount,
        from: addressToBuffer(sale.from),
        to: addressToBuffer(sale.to),
        fill_source: sale.fillSource,
        block: sale.block,
        tx_hash: addressToBuffer(sale.txHash),
        log_index: sale.logIndex,
        batch_index: sale.batchIndex,
        timestamp: sale.timestamp,
        wash_trading_score: sale.washTradingScore,
        created_at: sale.createdAt,
        price_currency_contract: addressToBuffer(sale.price.currency.contract),
        updated_at: sale.updatedAt,
        price_currency_name: sale.price.currency.name,
        price_currency_symbol: sale.price.currency.symbol,
        price_currency_decimals: sale.price.currency.decimals,
        price_amount_raw: sale.price.amount.raw,
        price_amount_decimal: sale.price.amount.decimal,
        price_amount_usd: sale.price.amount.usd,
        price_amount_native: sale.price.amount.native,
        isDeleted: sale.isDeleted,
      };
    });
  },
  asks: (asks: AsksSchema[]) => {
    if (!asks) return [];
    return asks?.map((ask: AsksSchema) => {
      return {
        id: Buffer.from(
          `${ask?.id}-${ask?.contract}-${ask?.maker}-${ask?.tokenSetId}-${ask?.createdAt}`
        ),
        ask_id: ask?.id ? addressToBuffer(ask.id) : null,
        kind: ask?.kind || null,
        side: ask?.side || null,
        status: ask?.status || null,
        token_set_id: ask?.tokenSetId || null,
        token_set_schema_hash: ask?.tokenSetSchemaHash
          ? addressToBuffer(ask.tokenSetSchemaHash)
          : null,
        contract: ask?.contract ? addressToBuffer(ask.contract) : null,
        maker: ask?.maker ? addressToBuffer(ask.maker) : null,
        taker: ask?.taker ? addressToBuffer(ask.taker) : null,
        price_currency_contract: ask?.price?.currency?.contract
          ? addressToBuffer(ask.price.currency.contract)
          : null,
        price_currency_name: ask?.price?.currency?.name || null,
        price_currency_symbol: ask?.price?.currency?.symbol || null,
        price_currency_decimals: ask?.price?.currency?.decimals || null,
        price_amount_raw: ask?.price?.amount?.raw || null,
        price_amount_decimal: ask?.price?.amount?.decimal || null,
        price_amount_native: ask?.price?.amount?.native || null,
        price_amount_usd: ask?.price?.amount?.usd || null,
        price_net_amount_decimal: ask?.price?.netAmount?.decimal || null,
        price_net_amount_native: ask?.price?.netAmount?.native || null,
        price_net_amount_raw: ask?.price?.netAmount?.raw || null,
        price_net_amount_usd: ask?.price?.netAmount?.usd || null,
        valid_from: ask?.validFrom || null,
        valid_until: ask?.validUntil || null,
        quantity_filled: ask?.quantityFilled || null,
        quantity_remaining: ask?.quantityRemaining || null,
        criteria_kind: ask?.criteria?.kind || null,
        criteria_data_token_token_id:
          ask?.criteria?.data?.token?.tokenId || null,
        source_domain: ask?.source?.domain || null,
        source_icon: ask?.source?.icon || null,
        source_url: ask?.source?.url || null,
        source_id: ask?.source?.id || null,
        fee_bps: ask?.feeBps || null,
        fee_breakdown: JSON.stringify(ask.feeBreakdown),
        expiration: ask?.expiration || null,
        is_reservoir: ask?.isReservoir || null,
        is_dynamic: ask?.isDynamic || null,
        updated_at: ask?.updatedAt || null,
        created_at: ask?.createdAt || null,
      };
    });
  },
};

/**
 * Parser methods for the raw API responses
 */
export const PARSER_METHODS: ParserMethods = {
  sales: (sales) => {
    return FORMAT_METHODS['sales'](sales) as PrismaSalesCreate[];
  },
  asks: (asks, contracts) => {
    if (contracts && contracts.length > 0) {
      asks = asks.filter((ask) =>
        contracts.includes(ask.contract.toLowerCase())
      );
    }
    return FORMAT_METHODS['asks'](asks) as PrismaAsksCreate[];
  },
};
/**
 * Request methods to return data from the API
 */
export const REQUEST_METHODS: RequestMethods = {
  sales: async ({ url, query, apiKey }): Promise<ApiResponse> => {
    try {
      const _res = await axios.get(`${url}?${query}`, {
        timeout: 100000,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });
      if (_res.status !== 200) throw _res;
      return {
        status: _res.status,
        data: _res.data,
      };
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        return {
          status: err.response?.status || 500,
          data: err.response?.data,
        };
      }
      return {
        status: 500,
        data: {
          status: 500,
          message: 'Unknown error.',
          error: err as string,
        },
      };
    }
  },
  asks: async ({ url, query, apiKey }): Promise<ApiResponse> => {
    try {
      const _res = await axios.get(`${url}?${query}`, {
        timeout: 100000,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });
      if (_res.status !== 200) throw _res;
      return {
        status: _res.status,
        data: _res.data,
      };
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        return {
          status: err.response?.status || 500,
          data: err.response?.data,
        };
      }
      return {
        status: 500,
        data: {
          status: 500,
          message: 'Unknown error.',
          error: err as string,
        },
      };
    }
  },
};
/**
 * The SyncService class handles assigning managers
 * to months so that the manager can process the data for that month and once
 * done can continue to upkeep or schedule itself for deletion
 * They can delete, create, and update managers
 */
export class SyncService {
  /**
   * # _apiKey
   * Reservoir API key to use for API request
   * @access private
   * @type {String}
   */
  private _apiKey: string;

  /**
   * # _isBackfilled
   * @access private
   * @type {Boolean}
   */
  private _isBackfilled: boolean;

  /**
   * # _date
   * The date to increment by
   * @access private
   * @type {String}
   */
  private _date: string;

  /**
   * # config
   * SyncService instance config
   * @access public
   * @type {SyncerConfig}
   */
  public readonly config: SyncerConfig;

  /**
   * # managers
   * SyncManager map
   * @access public
   * @type {Map<string, SyncManager>}
   */
  public managers: Map<string, SyncManager>;
  constructor(config: SyncerConfig) {
    /**
     * Set public variables
     */
    this.config = config;
    this.managers = new Map();

    /**
     * Set private variables
     */
    this._date = config.date;
    this._apiKey = config.apiKey;
    this._isBackfilled = false;
  }

  /**
   * # launch
   * Launches the SyncService
   * @access public
   * @returns {Promise<void>} Promise<void>
   */
  public launch(): void {
    this.config.backup?.data.managers
      ? this._restoreManagers()
      : this._createManagers();
    this._launchManagers();
  }
  /**
   * # _createManagers
   * Creates month managers for the sync service
   * @access private
   * @returns {Promise<void>} Promise<void>
   */
  private _createManagers(): void {
    for (let i = 0; i < Number(this.config.managerCount || 2); i++) {
      if (i !== 0) {
        const date = incrementDate(`${this._date.substring(0, 7)}-01`, {
          months: 1,
        });
        if (!isValidDate(date)) return;
        this._date = date;
      }
      const id = `${this.config.type}-manager-${uuid()}`;
      this.managers.set(
        id,
        new SyncManager({
          id,
          date: this._date,
          type: this.config.type,
          upkeepDelay: this.config.upkeepDelay,
          insert: this._insert.bind(this),
          request: this._request.bind(this),
          parse: this._parse.bind(this),
          format: this._format.bind(this),
          review: this._reviewManager.bind(this),
          count: this._count.bind(this),
          backup: this._backup.bind(this),
          workerCount: Number(this.config.workerCount || 4),
        })
      );
    }

    if (isSameMonth(this._date, getToday())) return;
    const id = `${this.config.type}-manager-${uuid()}`;
    this.managers.set(
      id,
      new SyncManager({
        id,
        date: getToday(),
        type: this.config.type,
        upkeepDelay: this.config.upkeepDelay,
        insert: this._insert.bind(this),
        request: this._request.bind(this),
        parse: this._parse.bind(this),
        format: this._format.bind(this),
        review: this._reviewManager.bind(this),
        count: this._count.bind(this),
        backup: this._backup.bind(this),
        workerCount: Number(this.config.workerCount || 4),
      })
    );
  }
  /**
   * # _restoreManagers
   * Restores month managers for the sync service from a backup
   * @access private
   * @returns {void} Promise<void>
   */
  private _restoreManagers(): void {
    this.managers = this.config?.backup?.data.managers.reduce(
      (managers, manager) => {
        const id = `${this.config.type}-manager-${uuid()}`;
        return managers.set(
          id,
          new SyncManager({
            id,
            date: manager.date,
            type: this.config.type,
            upkeepDelay: this.config.upkeepDelay,
            insert: this._insert.bind(this),
            request: this._request.bind(this),
            parse: this._parse.bind(this),
            format: this._format.bind(this),
            count: this._count.bind(this),
            review: this._reviewManager.bind(this),
            backup: this._backup.bind(this),
            workers: manager.workers,
            workerCount: Number(this.config.workerCount || 4),
          })
        );
      },
      new Map<string, SyncManager>()
    ) as Managers;
  }
  /**
   * # _createBackup
   * Backups the current state of the SyncNode
   * @access private
   * @returns {void}
   */
  private async _backup(): Promise<void> {
    await BackupService.backup({
      type: this.config.type,
      data: {
        date: this._date,
        managers: Array.from(this.managers.values()).map((manager) => {
          return {
            date: manager.date as string,
            workers: Array.from(manager.workers.values()).map((worker) => {
              return {
                date: worker.date,
                continuation: worker.continuation,
              };
            }),
          };
        }),
      },
    });
  }
  /**
   * # _deleteManager
   * Deletes an instance of a manager
   * @param {String} id - Manager instance
   * @returns {void} void
   */
  private _deleteManager(id: string): void {
    this.managers.delete(id);
  }
  private _reviewManager(manager: SyncManager): boolean {
    /**
     * If the manager has a worker that hit's a cursor - it is reported as backfilled and becomes our primary manager
     * This then means that all the other managers just need to finish what they are working on and will be queued for deletion once they are done
     */
    if (manager.isBackfilled) {
      this._isBackfilled = true; // We set this backfill to true because we know a manager
      /**
       * We return becasue we dont ever want to kill this manager because it contains our worker that is upkeeping
       * We don't need to assign it new work because it will continue forever due to their backfill flag being called
       */
      this._backup();
      return true;
    } else {
      this._backup();
      return this._continueWork(manager);
    }
  }
  /**
   * # _continueWork
   * Determines if a manager should continue working or not based on the date
   * @param {SyncManager} manager - Manager instance
   * @returns void
   */
  private _continueWork(manager: SyncManager): boolean {
    const _date = incrementDate(`${this._date.substring(0, 7)}-01`, {
      months: 1,
    });

    if (
      isValidDate(_date) &&
      !Array.from(this.managers.values()).some((manager) =>
        isSameMonth(_date, manager.date)
      )
    ) {
      this._date = _date;
      manager.config.date = _date;
      return true;
    } else {
      this._deleteManager(manager.id);
      return false;
    }
  }
  /**
   * # _launchMangers
   * Initial launch method for the managers
   * @access private
   * @returns  void
   */
  private async _launchManagers(): Promise<void> {
    const promises = await Promise.allSettled(
      Array.from(this.managers.values()).map((manager) => {
        return manager?.launch();
      })
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    promises.forEach((promise: any) => {
      this._deleteManager(promise.value);
    });
    this._backup();
  }
  /**
   * # _count
   * Counts the amount of objects in a data array
   * @param {Schemas[]} data - array of object data
   * @returns {Promise<void>} Promise<void>
   */
  private _count(data: KnownPropertiesType): number {
    const type = RECORD_ROOT[this.config.type];
    return data[type].length;
  }
  /**
   * # _insert
   * Inserts data into the database using the inseriton service
   * @access private
   * @param {Prisma.ordersCreateInput | Prisma.salesCreateInput} data - An array of objects
   * @returns {Promise<void>} Promise<void>
   */
  private _insert(data: KnownPropertiesType): void {
    InsertionService.upsert({
      data: this._parse(data[RECORD_ROOT[this.config.type]]).map((value) => {
        delete value.isDeleted;
        return value;
      }),
      table: this.config.type,
    });
    InsertionService.delete({
      table: this.config.type,
      ids: this._parse(data[RECORD_ROOT[this.config.type]])
        .filter((data) => data.isDeleted)
        .map((value) => {
          delete value.isDeleted;
          return value.id;
        }),
    });
  }
  /**
   * # _request
   * Uses the request methods to execute and return a request
   * @param {Request} Request - Request object containing a continuation and a date
   * @access private
   * @returns {Promise<ApiResponse>} Promise<ApiResponse>
   */
  private async _request({
    continuation,
    date,
    isBackfilled,
  }: Request): Promise<ApiResponse> {
    return await REQUEST_METHODS[this.config.type as keyof RequestMethods]({
      url: `${URL_BASES[this.config.chain]}${URL_PATHS[this.config.type]}`,
      query: createQuery(
        continuation,
        this.config.contracts,
        this.config.type,
        isBackfilled,
        date
      ),
      apiKey: this._apiKey,
    });
  }
  /**
   * # _parse
   * Parses and formats raw data from the api into the prisma format
   * @param {Schemas[]} data Schemas array
   * @returns {PrismaCreate[]} PrismaCreate[]
   */
  private _parse(data: Schemas): PrismaCreate[] {
    return PARSER_METHODS[this.config.type as keyof ParserMethods](
      data as DataType<typeof this.config.type>,
      this.config.contracts
    );
  }
  /**
   * # _format
   * Formats and returns an unknown dataset
   * @param {IndexSignatureType} data API response data
   * @returns {Schemas} formatted data
   */
  private _format(data: KnownPropertiesType): Schemas {
    return data[RECORD_ROOT[this.config.type]];
  }
}
