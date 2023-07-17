import { Server } from './server/Server';
import {
  GraphQlService,
  InsertionService,
  LoggerService,
  QueueService,
  WebSocketService,
} from './services';
import { Controller } from './syncer/Controller';
import { Chains, DataTypes, Mode, SyncNodeConfig } from './types';

class SyncNode {
  /**
   * # _graphqlService
   * @access private
   */
  private readonly _graphqlService: typeof GraphQlService = GraphQlService;
  /**
   * # _webSocketService
   * @access private
   */
  private readonly _webSocketService: typeof WebSocketService =
    WebSocketService;

  /**
   * # _insertionService
   * @access private
   */
  private readonly _insertionService: typeof InsertionService =
    InsertionService;

  /**
   * # _loggerService
   * @access private
   */
  private readonly _loggerService: typeof LoggerService = LoggerService;

  /**
   * # _queueServivice
   */
  private readonly _queueService: typeof QueueService = QueueService;

  /**
   * # _server
   * @access private
   */
  private readonly _server: typeof Server = Server;

  /**
   * # _config
   * @access private
   */
  private readonly _config: SyncNodeConfig;

  /**
   * Controllers used to sync the datasets
   * @private
   */
  private readonly _controllers: Map<DataTypes, Controller> = new Map();

  /**
   * Array of contracts
   * @private
   */
  private _contracts: string[];

  constructor(config: SyncNodeConfig) {
    this._config = config;
    this._contracts = config.syncer.contracts;
    this._server.construct(config.server);
    this._loggerService.construct(config.logger);
    this._queueService.construct(config.backup);
    this._webSocketService.construct({
      ...this._config.syncer,
    });
  }
  /**
   * Launches the SyncNode
   * @async
   * @returns void
   */
  public async launch(): Promise<void> {
    await this._server.launch();
    await this._queueService.launch();
    await this._insertionService.launch();
    await this._webSocketService.launch();

    await this._queueService.loadBackup();
    LoggerService.info(`Launched All Services`);

    this._createControllers();
  }
  /**
   * Gets a controller using a specific datatype
   * @param controller The controller to get
   * @returns An active controller or undefined if no controller was found
   */
  public getController(controller: DataTypes): Controller | undefined {
    return this._controllers.get(controller);
  }

  /**
   * Gets the contracts to filter by
   * @returns contracts array
   */
  public getContracts(): string[] {
    return this._contracts;
  }
  /**
   * Inserts a contract into the contract array
   * @returns void
   */
  public insertContract(contract: string): void {
    this._contracts.push(contract);
  }
  /**
   * Creates the controllers for each datatype
   * @private
   * @returns void
   */
  private _createControllers(): void {
    const { syncer } = this._config;

    if (syncer.toSync.sales) {
      this._controllers.set(
        'sales',
        new Controller({
          apiKey: this._config.syncer.apiKey,
          dataset: 'sales',
          type: 'backfill',
          chain: this._config.syncer.chain,
          delay: 0,
          mode: this._config.syncer.mode,
        })
      );
    }

    if (syncer.toSync.asks) {
      this._controllers.set(
        'asks',
        new Controller({
          apiKey: this._config.syncer.apiKey,
          dataset: 'asks',
          type: 'backfill',
          chain: this._config.syncer.chain,
          delay: 0,
          mode: this._config.syncer.mode,
        })
      );
    }

    if (syncer.toSync.bids) {
      this._controllers.set(
        'bids',
        new Controller({
          apiKey: this._config.syncer.apiKey,
          dataset: 'bids',
          type: 'backfill',
          chain: this._config.syncer.chain,
          delay: 0,
          mode: this._config.syncer.mode,
        })
      );
    }
  }
}

export default new SyncNode({
  syncer: {
    chain: process.env.CHAIN as Chains,
    apiKey: process.env.API_KEY as string,
    contracts:
      (process.env.CONTRACTS && process.env.CONTRACTS.split(',')) || [],
    toSync: {
      bids: true,
      asks: true,
      sales: true,
    },
    mode: process.env.MODE as Mode,
  },
  server: {
    port: Number(process.env.PORT) as number,
    authorization: process.env.AUTHORIZATION as string,
  },
  backup: {
    useBackup: true,
  },
  logger: {
    datadog: {
      apiKey: 'xxxx-xxxx-xxxx',
      appName: 'sync-node',
    },
  },
});
