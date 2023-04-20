import axios, { isAxiosError } from 'axios';
import { uuid } from 'uuidv4';
import { InsertionService, SyncManager } from '../services';
import {
  ApiResponse,
  Bases,
  FormatMethods,
  IndexSignatureType,
  Managers,
  ParserMethods,
  Paths,
  PrismaCreate,
  PrismaSalesCreate,
  Request,
  RequestMethods,
  SalesSchema,
  Schemas,
  SyncerConfig,
} from '../types';
import {
  addressToBuffer,
  createQuery,
  incrementDate,
  isValidDate,
  toBuffer,
} from '../utils';
import { BackupService } from './BackupService';

/**
 * The URL paths for the sync APIs
 */
export const URL_PATHS: Paths = {
  sales: '/sales/v4',
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
};
/**
 * Parser methods for the raw API responses
 */
export const PARSER_METHODS: ParserMethods = {
  sales: (sales, contracts) => {
    if (contracts && contracts?.length > 0) {
      sales = sales.filter((s: { token: { contract: string } }) =>
        contracts
          .map((s: string) => s.toLowerCase())
          .includes(s.token.contract.toLowerCase())
      );
    }
    return FORMAT_METHODS['sales'](sales) as PrismaSalesCreate[];
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
    } catch (err: any) {
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
          error: err,
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
   * Api key to use for API requests
   * @access private
   * @type {String}
   */
  private _apiKey: string;
  /**
   * # _url
   * Url to return data from
   * @access private
   * @type {String}
   */
  private _url: string;
  /**
   * # _backfilled
   * Backfilled flag used to determine if a manager has reached the present
   * @access private
   * @type {Boolean}
   */
  private _backfilled: boolean;
  /**
   * # _workerCount
   * The amount of workers the SyncService can create
   * @access private
   * @type {Number}
   */
  private _workerCount: number;
  /**
   * # _managerCount
   * The amount of managers the SyncService can create
   * @access private
   * @type {Number}
   */
  private _managerCount: number;
  /**
   * # _date
   * The latest date to increment the managers with
   * @access private
   * @type {String}
   */
  private _date: string;
  /**
   * # managers
   * SyncService instance month managers
   * @access public
   * @type {Map<string, SyncManager | undefined>}
   */
  public managers: Map<string, SyncManager | undefined> = new Map();
  /**
   * SyncService instance config
   * @access public
   * @type {SyncerConfig}
   */
  public readonly config: SyncerConfig;

  constructor(_config: SyncerConfig) {
    const { backup, date, apiKey, chain, type, workerCount, managerCount } =
      _config;

    this.config = _config;
    this._apiKey = apiKey;

    this._backfilled = false;
    this._date = backup?.date ? backup?.date : date;
    this._url = `${URL_BASES[chain]}${URL_PATHS[type as keyof Paths]}`;

    this._workerCount = Number(workerCount) || 1;
    this._managerCount = Number(managerCount) || 1;
  }
  /**
   * # launch
   * Launches the SyncService
   * @access public
   * @returns {Promise<void>} Promise<void>
   */
  public launch(): void {
    this.config.backup?.managers
      ? this._restoreManagers()
      : this._createManagers();
    this._watchManagers();
    this._launchManagers();
  }
  /**
   * # _restoreManagers
   * Restores month managers for the sync service from a backup
   * @access private
   * @returns {void} Promise<void>
   */
  private _restoreManagers(): void {
    this.managers = this.config?.backup?.managers.reduce(
      (managers, manager) => {
        return managers.set(
          `${this.config.type}-manager-${uuid()}`,
          new SyncManager({
            date: manager.date,
            insert: this._insert.bind(this),
            request: this._request.bind(this),
            parse: this._parse.bind(this),
            format: this._format.bind(this),
            count: this._count.bind(this),
            backup: this._backup.bind(this),
            workers: manager.workers,
            workerCount: this._workerCount,
          })
        );
      },
      new Map<string, SyncManager | undefined>()
    ) as Managers;
  }
  /**
   * # _createBackup
   * Backups the current state of the LightNode
   * @access private
   * @returns {void}
   */
  private async _backup(): Promise<void> {
    BackupService.backup({
      date: this._date,
      type: this.config.type,
      managers: Array.from(this.managers.values()).map((manager) => {
        return {
          date: manager?._date as string,
          workers: manager?.workers
            ? Array.from(manager?.workers.values()).map((worker) => {
                return {
                  date: worker?.config.date || '',
                  continuation: worker?._continuation || '',
                };
              })
            : [],
        };
      }),
    });
  }
  /**
   * # _createManagers
   * Creates month managers for the sync service
   * @access private
   * @returns {Promise<void>} Promise<void>
   */
  private _createManagers(): void {
    for (let i = 0; i < this._managerCount; i++) {
      if (i !== 0) {
        const date = incrementDate(this._date, { months: 1 });
        if (!isValidDate(date)) return;
        this._date = date;
      }
      this.managers.set(
        `${this.config.type}-manager-${uuid()}`,
        new SyncManager({
          date: this._date,
          insert: this._insert.bind(this),
          request: this._request.bind(this),
          parse: this._parse.bind(this),
          format: this._format.bind(this),
          count: this._count.bind(this),
          backup: this._backup.bind(this),
          workerCount: this._workerCount,
        })
      );
    }
  }
  /**
   * # _count
   * Counts the amount of objects in a data array
   * @param {Schemas[]} data - array of object data
   * @returns {Promise<void>} Promise<void>
   */
  private _count(data: IndexSignatureType): number {
    return data[this.config.type].length;
  }
  /**
   * # _insert
   * Inserts data into the database using the inseriton service
   * @access private
   * @param {Prisma.ordersCreateInput | Prisma.salesCreateInput} data - An array of objects
   * @returns {Promise<void>} Promise<void>
   */
  private _insert(data: IndexSignatureType): void {
    InsertionService.upsert({
      data: this._parse(data[this.config.type]).map((value) => {
        delete value.isDeleted;
        return value;
      }),
      table: this.config.type,
    });
    InsertionService.delete({
      table: this.config.type,
      ids: this._parse(data[this.config.type])
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
  }: Request): Promise<ApiResponse> {
    return await REQUEST_METHODS[this.config.type as keyof RequestMethods]({
      url: this._url,
      query: createQuery(continuation, this.config.contracts, date),
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
      data,
      this.config.contracts
    );
  }
  /**
   * # _format
   * Formats and returns an unknown dataset
   * @param {IndexSignatureType} data API response data
   * @returns {Schemas} formatted data
   */
  private _format(data: IndexSignatureType): Schemas {
    return data[this.config.type];
  }
  /**
   * # _watchMangers
   * Watches the SyncService managers for flag changes/updates
   * @access private
   * @returns {void} void
   */
  private _watchManagers(): void {
    setInterval(() => {
      this.managers.forEach((manager, id): void => {
        // TypeSafety return!
        if (!manager) return;

        /**
         * If the manager has a worker that hit's a cursor - it is reported as backfilled and becomes our primary manager
         * This then means that all the other managers just need to finish what they are working on and will be queued for deletion once they are done
         */
        if (manager.backfilled) {
          this._backfilled = true; // We set this backfill to true because we know a manager
          /**
           * We return becasue we dont ever want to kill this manager because it contains our worker that is upkeeping
           * We don't need to assign it new work because it will continue forever due to their backfill flag being called
           */
          return;
        }

        /**
         * If a mangager is no longer busy and we have recieved the backfill flag from another manager
         * Then we can delete this instance becasue it's done and has no more use
         * We only delete it IF its done AND if one of the managers has reported that the backfill has been reached
         */
        if (!manager?.isBusy && this._backfilled) {
          this._deleteManager(manager, id);
        } else if (!manager.isBusy) {
          // Review logic?
          this._assignManager(manager, id);
        }
      });
    }, 1000);
  }
  /**
   * # _deleteManager
   * Deletes an instance of a manager
   * @param {SyncManager} manager - Manager instance
   * @returns {void} void
   */
  private _deleteManager(manager: SyncManager, id: string): void {
    if (Array.from(manager.workers.values()).some((worker) => worker?.isBusy))
      return;

    if (manager.watcher) clearInterval(manager.watcher);
    this.managers.set(id, undefined);
    this.managers.delete(id);
  }
  /**
   * # _assignManager
   * Assigns an instance of a manager with new work
   * @param {SyncManager} manager - Manager instance
   * @returns {void} void
   */
  private _assignManager(manager: SyncManager, id: string): void {
    const _date = incrementDate(this._date, { months: 1 });

    if (!isValidDate(_date)) {
    //  this._deleteManager(manager, id);
    } else {
      this._date = _date;
      manager._config.date = _date;
      manager.launch();
    }
  }
  /**
   * # _launchMangers
   * Initial launch method for the managers
   * @access private
   * @returns {void} void
   */
  private _launchManagers(): void {
    this.managers.forEach((manager) => manager?.launch());
  }
}
