/* eslint-disable no-console */
import { formatDistance } from 'date-fns';
import { ServerManager } from './server/Server';
import {
  BackupService,
  LoggerService,
  RECORD_ROOT,
  REQUEST_METHODS,
  SyncService,
  URL_BASES,
  URL_PATHS,
  WebSocketService,
} from './services';
import {
  Backup,
  IndexSignatureType,
  Status,
  SyncerConfig,
  SyncNodeConfig,
  Tables,
} from './types';
import {
  createQuery,
  getContractInfo,
  getMonth,
  getYear,
  isAddress,
  isSuccessResponse,
} from './utils/utils';

/**
 * SyncNode class represents a lightweight node for syncing data.
 * It is responsible for setting up and managing synchronization services, called SyncerServices.
 * The SyncNode class is initialized with a configuration object, which contains information
 * about the synchronization process, API keys, contracts, and other settings.
 */
class _SyncNode {
  /**
   * SyncNode configuration
   * @type {SyncNodeConfig}
   * @access private
   */
  private _config!: SyncNodeConfig;

  /**
   * SyncNode syncers
   * @type {Map<string, SyncService>}
   * @access private
   */
  private readonly _syncers: Map<string, SyncService> = new Map();

  /**
   * # launch
   * Launches the SyncNode instance
   * @param {SyncNodeConfig} _config - The configuration object for the SyncNode.
   * @returns {void}
   * @access public
   */
  public async launch(_config: SyncNodeConfig): Promise<void> {
    this._config = _config;
    this._validateConfig();
    this._setServices();
    await this._launchServices();
    await this._createSyncers();
    this._launchSyncers();
    this._logSyncers();
  }
  /**
   *  # createSyncer
   * Creates a a new syncer
   * @param type - Type of syncer
   * @param contracts - Contracts to filter
   * @returns {string | null} string or null
   */
  public async createSyncer(type: Tables, contract: string): Promise<void> {
    const { name } = await getContractInfo(contract);
    const id = `${type}-syncer-${name}`;
    const syncService = new SyncService({
      chain: this._config.syncer.chain,
      workerCount: this._config.syncer.workerCount,
      managerCount: this._config.syncer.managerCount,
      apiKey: this._config.syncer.apiKey,
      contracts: [contract.toLowerCase()],
      upkeepDelay: 0,
      type: type,
      date: await this._getStartDate(type),
      backup: await this._loadBackup(type),
    });

    this._syncers.set(id, syncService);

    this._syncers.get(id)?.launch();
  }
  /**
   * # _launchServices
   * @returns {void}
   * @access private
   */
  private async _launchServices(): Promise<void> {
    ServerManager.launch();
    WebSocketService.launch();
    await BackupService.launch();
  }

  /**
   * # _logSyncers
   * Logs information about the SyncNode syncer
   * @returns {void}
   * @access private
   */
  private _logSyncers(): void {
    const processStart = new Date();
    process.title = 'Reservoir Sync Node';
    setInterval(() => {
      interface WorkersLog {
        worker: string;
        date: string;
        insertions: number;
        status: Status;
        busy: boolean;
        backfilled: boolean;
        continuation: string;
        '2xx': number;
        '4xx': number;
        '5xx': number;
      }
      interface ManagersLog {
        busy: boolean;
        status: Status;
        type: Tables;
        syncer: string;
        manager: string;
        year: string;
        month: string;
        requests: number;
        insertions: number;
        backfilled: boolean;
      }
      const workers: WorkersLog[] = [];
      const managers: ManagersLog[] = [];

      this._syncers.forEach((syncer, syncerId) => {
        syncer.managers.forEach((manager, id) => {
          if (!manager) return;
          managers.push({
            type: syncer.config.type,
            syncer: syncerId,
            manager: id,
            year: getYear(manager?.config.date),
            month: getMonth(manager?.config.date),
            requests: manager?.requestCount,
            insertions: manager?.insertCount,
            status: manager?.status,
            busy: manager?.isBusy,
            backfilled: manager?.isBackfilled,
          });
          manager.workers.forEach((worker, id) => {
            workers.push({
              worker: id,
              date: worker?.date.substring(5),
              busy: worker?.isBusy,
              status: worker?.status,
              backfilled: worker?.isBackfilled,
              insertions: worker?.counts?._insertions,
              continuation: worker?.continuation,
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
      console.table(
        workers.sort(
          (a, b) => new Date(a.date).getDate() - new Date(b.date).getDate()
        )
      );
    }, 100);
  }

  /**
   * # _getStartDate
   * Gets the start date for the SyncNode
   * @param {SyncNodeConfig} syncer - The type of the syncer, which is used to parse and insert in a generic way.
   * @returns {string} - The start date for the SyncNode.
   */
  private async _getStartDate(syncer: SyncerConfig['type']): Promise<string> {
    if (this._config.syncer.skipBackfill)
      return new Date().toISOString().substring(0, 10);

    const res = await REQUEST_METHODS.sales({
      url: `${URL_BASES[this._config.syncer.chain]}${URL_PATHS[syncer]}`,
      query: createQuery('', this._config.syncer.contracts, syncer, false),
      apiKey: this._config.syncer.apiKey,
    });
    if (!isSuccessResponse(res))
      throw new Error(
        `FAILED TO GET STARTED DATE: ${res.data.message}:${res.status}`
      );

    const data = res.data as IndexSignatureType;

    const type = RECORD_ROOT[syncer];
    if (data[type]?.length > 0 && data[type]?.[0]) {
      return data[type][0].updatedAt.substring(0, 10);
    }
    return new Date().toISOString().substring(0, 10);
  }

  /**
   * # _createSyncers
   * Creates the SyncNode syncers
   * @returns {void}
   * @access private
   */
  private async _createSyncers(): Promise<void> {
    const { syncer, backup } = this._config;
    if (!backup?.useBackup) {
      await BackupService.flush();
    }

    if (syncer.contracts && syncer.contracts.length > 0) {
      for await (const contract of syncer.contracts) {
        if (syncer.toSync.sales) {
          const { name } = await getContractInfo(contract);
          this._syncers.set(
            `sales-syncer-${name}`,
            new SyncService({
              chain: syncer.chain,
              workerCount: syncer.workerCount,
              managerCount: syncer.managerCount,
              apiKey: syncer.apiKey,
              contracts: [contract.toLowerCase()],
              upkeepDelay: 60,
              type: 'sales',
              date: await this._getStartDate('sales'),
              backup: await this._loadBackup('sales'),
            })
          );
        }
        if (syncer.toSync.asks) {
          const { name } = await getContractInfo(contract);
          this._syncers.set(
            `asks-syncer-${name}`,
            new SyncService({
              chain: syncer.chain,
              workerCount: syncer.workerCount,
              managerCount: syncer.managerCount,
              apiKey: syncer.apiKey,
              upkeepDelay: 60,
              contracts: syncer.contracts.map((c) => c.toLowerCase()),
              type: 'asks',
              date: await this._getStartDate('asks'),
              backup: await this._loadBackup('asks'),
            })
          );
        }
        if (syncer.toSync.bids) {
          const { name } = await getContractInfo(contract);
          this._syncers.set(
            `bids-syncer-${name}`,
            new SyncService({
              chain: syncer.chain,
              workerCount: syncer.workerCount,
              managerCount: syncer.managerCount,
              apiKey: syncer.apiKey,
              upkeepDelay: 60,
              contracts: syncer.contracts.map((c) => c.toLowerCase()),
              type: 'bids',
              date: await this._getStartDate('bids'),
              backup: await this._loadBackup('bids'),
            })
          );
        }
      }

      return;
    }

    if (syncer.toSync.sales) {
      this._syncers.set(
        `sales-syncer-no-contract`,
        new SyncService({
          chain: syncer.chain,
          workerCount: syncer.workerCount,
          managerCount: syncer.managerCount,
          apiKey: syncer.apiKey,
          contracts: [],
          upkeepDelay: 60,
          type: 'sales',
          date: await this._getStartDate('sales'),
          backup: await this._loadBackup('sales'),
        })
      );
    }
    if (syncer.toSync.asks) {
      this._syncers.set(
        `asks-syncer-no-contract`,
        new SyncService({
          chain: syncer.chain,
          workerCount: syncer.workerCount,
          managerCount: syncer.managerCount,
          apiKey: syncer.apiKey,
          upkeepDelay: 60,
          contracts: [],
          type: 'asks',
          date: await this._getStartDate('asks'),
          backup: await this._loadBackup('asks'),
        })
      );
    }
    if (syncer.toSync.bids) {
      this._syncers.set(
        `bids-syncer-no-contract`,
        new SyncService({
          chain: syncer.chain,
          workerCount: syncer.workerCount,
          managerCount: syncer.managerCount,
          apiKey: syncer.apiKey,
          upkeepDelay: 60,
          contracts: [],
          type: 'bids',
          date: await this._getStartDate('bids'),
          backup: await this._loadBackup('bids'),
        })
      );
    }
  }

  /**
   * # _launchSyncers
   * Launches the SyncNode syncers
   * @returns {void}
   * @access private
   */
  private _launchSyncers(): void {
    this._syncers.forEach((syncer): void => syncer.launch());
  }

  /**
   * # _setServivices
   * Sets internal services for the SyncNode
   * @returns {void}
   * @access private
   */
  private _setServices(): void {
    LoggerService.set(this._config.logger);
    ServerManager.set(this._config.server);
    BackupService.set(this._config.backup);
    WebSocketService.set({
      apiKey: this._config.syncer.apiKey,
      contracts: this._config.syncer.contracts,
      chain: this._config.syncer.chain,
      toConnect: {
        bids: this._config.syncer.toSync.bids,
        sales: this._config.syncer.toSync.sales,
        asks: this._config.syncer.toSync.asks,
      },
    });
  }

  /**
   * # _validateConfig
   * Validates the SyncNode configuration
   * @returns {void}
   * @access private
   * @throws {Error} - If any part of the configuration is invalid.
   */
  private _validateConfig(): void {
    const { server, syncer, logger, backup } = this._config;

    if (backup && !backup.redisUrl) {
      throw new Error(`INVALID REDIS URl; ${backup.redisUrl}`);
    }

    if (String(server.port).length !== 4)
      throw new Error(`INVALID SERVER PORT: ${server.port}`);

    if (!server.authorization)
      throw new Error(`INVALID SERVER AUTHORIZATION: ${server.authorization}`);

    if (logger?.datadog) {
      const { appName, apiKey } = logger.datadog;
      if (!appName || !apiKey)
        throw new Error(`INVALID DATADOG CONFIG: ${appName}-${apiKey}`);
    }

    if (!syncer.apiKey)
      throw new Error(`AN API KEY IS REQUIRED: ${syncer.apiKey}`);

    if (syncer?.contracts) {
      syncer.contracts.forEach((contract) => {
        if (!isAddress(contract)) {
          throw new Error(`INVALID CONTRACT ADDRESS: ${contract}`);
        }
      });
    }

    if (!syncer.chain) throw new Error(`INVALID CHAIN: ${syncer.chain}`);
  }
  /**
   * # _loadBackup
   * Loads a backup of the most recent state of the SyncNode
   * @param {String} type - SyncerType
   * @access private
   * @returns {Backup} - SyncNode Backup
   */
  private async _loadBackup(type: string): Promise<Backup | null> {
    return BackupService.load(type);
  }
}

export const SyncNode = new _SyncNode();
