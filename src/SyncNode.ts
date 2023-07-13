import { Server } from './server/Server';
import {
  GraphQlService,
  InsertionService,
  LoggerService,
  QueueService,
  WebSocketService,
} from './services';
import { Controller } from './syncer/Controller';
import { SyncNodeConfig } from './types';

export class SyncNode {
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

  constructor(config: SyncNodeConfig) {
    this._config = config;
    this._server.construct(config.server);
    this._loggerService.construct(config.logger);
    this._queueService.construct(config.backup);
    this._webSocketService.construct({
      contracts: [],
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
    //  await this._webSocketService.launch();

    await this._queueService.loadBackup();
    LoggerService.info(`Launched All Services`);

    new Controller({
      apiKey: this._config.syncer.apiKey,
      dataset: 'sales',
      type: 'backfill',
      chain: 'mainnet',
      contracts: [],
      delay: 0,
      mode: 'fast',
    });
  }
}
