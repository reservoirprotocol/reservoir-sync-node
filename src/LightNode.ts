/* eslint-disable no-console */
import { formatDistance } from 'date-fns';
import { ServerManager } from './server/Server';
import {
  InsertionService,
  LoggerService,
  PARSER_METHODS,
  REQUEST_METHODS,
  SyncService,
  URL_BASES,
  URL_PATHS,
} from './services';
import {
  IndexSignatureType,
  LightNodeConfig,
  PrismaCreate,
  SyncerConfig,
} from './types';
import { isAddress, getMonth, getYear, createQuery } from './utils/utils';

/**
 * LightNode class represents a lightweight node for syncing data.
 * It is responsible for setting up and managing synchronization services, called SyncerServices.
 * The LightNode class is initialized with a configuration object, which contains information
 * about the synchronization process, API keys, contracts, and other settings.
 */
class _LightNode {
  /**
   * LightNode configuration
   * @type {LightNodeConfig}
   * @access private
   */
  private _config!: LightNodeConfig;

  /**
   * LightNode syncers
   * @type {Map<string, SyncService>}
   * @access private
   */
  private readonly _syncers: Map<string, SyncService> = new Map();

  /**
   * # launch
   * Launches the LightNode instance
   * @param {LightNodeConfig} _config - The configuration object for the LightNode.
   * @returns {void}
   * @access public
   */
  public async launch(_config: LightNodeConfig) {
    this._config = _config;
    this._validateConfig();
    this._setServices();
    this._launchServices();
    await this._createSyncers();
    this._launchSyncers();
    this._logSyncers();
  }
  /**
   * # _launchServices
   * @returns {void}
   * @access private
   */
  private _launchServices(): void {
    ServerManager.launch();
  }

  /**
   * # _logSyncers
   * Logs information about the LightNode syncer
   * @returns {void}
   * @access private
   */
  private _logSyncers(): void {
    const processStart = new Date();
    process.title = 'Reservoir Light Node';
    setInterval(() => {
      let workers: any[] = [];
      let managers: any[] = [];

      this._syncers.forEach((syncer) => {
        syncer.managers.forEach((manager, id) => {
          if (!manager) return;
          managers.push({
            Manager: id,
            Year: getYear(manager?._config.date),
            Month: getMonth(manager?._config.date),
            Requests: manager?.requestCount,
            Insertions: manager?.insertCount,
            Status: manager?.status,
            Busy: manager?.isBusy,
            Backfilled: manager?.backfilled,
          });
          manager.workers.forEach((worker, id) => {
            workers.push({
              Worker: id,
              Date: worker?.config.date.substring(5),
              Busy: worker?.isBusy,
              Status: worker?.status,
              Backfilled: worker?.backfilled,
              Insertions: worker?.counts?._insertions,
              '2xx': worker?.counts._requests['2xx'],
              '4xx': worker?.counts._requests['4xx'],
              '5xx': worker?.counts?._requests['5xx'],
            });
          });
        });
      });

      console.clear();
      const used = process.memoryUsage();
      const timeSince = formatDistance(processStart, new Date(), {
        addSuffix: true,
      });
      console.log(`Runtime: ${processStart} (${timeSince})`);
      console.log(
        `Memory usage: ${Math.round((used.rss / 1024 / 1024) * 100) / 100} MB`
      );
      console.table(managers);
      console.table(workers);
    }, 100);
  }

  /**
   * # _getStartDate
   * Gets the start date for the lightnode
   * @param {LightNodeConfig} syncer - The type of the syncer, which is used to parse and insert in a generic way.
   * @returns {string} - The start date for the LightNode.
   */
  private async _getStartDate(syncer: SyncerConfig['type']): Promise<string> {
    const res = await REQUEST_METHODS.sales({
      url: `${URL_BASES[this._config.syncer.chain]}${URL_PATHS[syncer]}`,
      query: createQuery('', this._config.syncer.contracts),
      apiKey: this._config.syncer.apiKey,
    });
    const data = res.data as IndexSignatureType;

    const parsedData = PARSER_METHODS[syncer](
      data[syncer],
      this._config.syncer.contracts
    ) as PrismaCreate[];

    InsertionService.upsert({
      data: parsedData.map((value) => {
        delete value.isDeleted;
        return value;
      }),
      table: syncer,
    });
    InsertionService.delete({
      table: syncer,
      ids: parsedData
        .filter((data) => data.isDeleted)
        .map((value) => {
          delete value.isDeleted;
          return value.id;
        }),
    });

    if (data[syncer].length > 0 && data[syncer][0].updatedAt) {
      return data[syncer][0].updatedAt.substring(0, 10);
    }
    return new Date().toISOString().substring(0, 10);
  }

  /**
   * # _createSyncers
   * Creates the LightNode syncers
   * @returns {void}
   * @access private
   */
  private async _createSyncers() {
    const syncer = this._config.syncer;

    if (syncer.toSync.sales) {
      const startDate = await this._getStartDate('sales');
      this._syncers.set(
        'sales-syncer',
        new SyncService({
          chain: syncer.chain,
          workerCount: syncer.workerCount,
          managerCount: syncer.managerCount,
          apiKey: syncer.apiKey,
          contracts: syncer.contracts,
          type: 'sales',
          date: startDate,
        })
      );
    }
    return true;
  }

  /**
   * # _launchSyncers
   * Launches the LightNode syncers
   * @returns {void}
   * @access private
   */
  private _launchSyncers(): void {
    this._syncers.forEach((syncer): void => syncer.launch());
  }

  /**
   * # _setServivices
   * Sets internal services for the LightNode
   * @returns {void}
   * @access private
   */
  private _setServices(): void {
    LoggerService.set(this._config.logger);
    ServerManager.set(this._config.server);
  }

  /**
   * # _validateConfig
   * Validates the LightNode configuration
   * @returns {void}
   * @access private
   * @throws {Error} - If any part of the configuration is invalid.
   */
  private _validateConfig(): void {
    const { server, syncer, logger } = this._config;

    // Validate server port
    if (String(server.port).length !== 4)
      throw new Error(`INVALID SERVER PORT: ${server.port}`);

    // Validate server authorization
    if (!server.authorization)
      throw new Error(`INVALID SERVER AUTHORIZATION: ${server.authorization}`);

    // Validate datadog configuration (if present)
    if (logger?.datadog) {
      const { appName, apiKey } = logger.datadog;
      if (!appName || !apiKey)
        throw new Error(`INVALID DATADOG CONFIG: ${appName}-${apiKey}`);
    }

    // Validate api keys
    if (!syncer.apiKey)
      throw new Error(`AN API KEY IS REQUIRED: ${syncer.apiKey}`);

    // Validate the contracts to filter by
    if (syncer?.contracts) {
      syncer.contracts.forEach((contract) => {
        if (!isAddress(contract)) {
          throw new Error(`INVALID CONTRACT ADDRESS: ${contract}`);
        }
      });
    }

    // Validate chain
    if (!syncer.chain) throw new Error(`INVALID CHAIN: ${syncer.chain}`);
  }
}

export const LightNode = new _LightNode();
