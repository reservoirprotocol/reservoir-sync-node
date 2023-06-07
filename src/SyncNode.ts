import { InsertionService, LoggerService, WebSocketService } from './services';
WebSocketService;
InsertionService;
LoggerService;

type DataTypes = 'sales' | 'asks';

interface SyncNodeConfig {
  server: {
    port: string;
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
   */
  private _webSocketService: typeof WebSocketService = WebSocketService;

  /**
   * # _insertionService
   */
  private _insertionService: typeof InsertionService = InsertionService;

  /**
   * # _loggerService
   */
  private _loggerService: typeof LoggerService = LoggerService;

  constructor(config: SyncNodeConfig) {
    this._webSocketService.construct();
    this._insertionService.construct(config.syncer);
    this._loggerService.construct(config.logger);
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
    port: '1111',
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
