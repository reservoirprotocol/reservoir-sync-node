import { Server } from './server/Server';
import { InsertionService, LoggerService, WebSocketService } from './services';
import { DataTypes } from './types';

interface SyncNodeConfig {
  server: {
    port: number;
    authorization: string;
  };
  syncer: {
    mappings: {
      datasets: DataTypes[];
      table: string;
      contracts: string[];
    }[];
  };
  logger: {
    datadog: {
      apiKey: string;
      appName: string;
    };
  };
}

class SyncNode {
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

  private _server: typeof Server = Server;

  constructor(config: SyncNodeConfig) {
    this._webSocketService.construct();
    this._insertionService.construct(config.syncer);
    this._loggerService.construct(config.logger);
    this._server.construct(config.server);
  }
}

const config: SyncNodeConfig = {
  syncer: {
    mappings: [
      {
        datasets: ['asks'],
        table: 'asks',
        contracts: [],
      },
    ],
  },
  server: {
    port: 1111,
    authorization: 'default',
  },
  logger: {
    datadog: {
      apiKey: 'xxxx-xxxx-xxxx',
      appName: 'sync-node',
    },
  },
};

export const node = new SyncNode(config);
