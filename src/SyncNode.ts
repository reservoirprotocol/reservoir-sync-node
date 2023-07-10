import { Server } from './server/Server';
import {
  GraphQlService,
  InsertionService,
  LoggerService,
  WebSocketService
} from './services';
import { Controller } from './syncer/Controller';
import { SyncNodeConfig } from './types';

export class SyncNode {
  /**
   * # _graphqlService
   * @access private
   */
  private _graphqlService: typeof GraphQlService = GraphQlService;
  /**
   * # _webSocketService
   * @access private
   */
  private _webSocketService: typeof WebSocketService = WebSocketService;

  /**
   * # _insertionService
   * @access private
   */
  private _insertionService: typeof InsertionService = InsertionService;

  /**
   * # _loggerService
   * @access private
   */
  private _loggerService: typeof LoggerService = LoggerService;

  /**
   * # _server
   * @access private
   */
  private _server: typeof Server = Server;

  constructor(config: SyncNodeConfig) {
    /*
    this._webSocketService.construct({
      contracts: config.syncer.mappings.flatMap((mapping) => mapping.contracts),
      ...config.syncer,
    });

    */
    this._graphqlService.construct(config.syncer);
    this._insertionService.construct(config.syncer);
    this._loggerService.construct(config.logger);
    this._server.construct(config.server);

    new Controller({
      apiKey: config.syncer.apiKey,
      dataset: 'sales',
      type: 'backfill',
      chain: 'mainnet',
      contracts: [],
      delay: 0,
      mode: 'fast',
    });
  }
  /**
   * Launches the SyncNode
   * @async
   * @returns void
   */
  public async launch(): Promise<void> {
    await this._insertionService.launch();
    await this._webSocketService.launch();
    await this._server.launch();
    LoggerService.info(`Launched all services.`);
  }
}
