import { ChildProcess, spawn } from "child_process";
import { readContracts } from "./utils";
import {
  InsertionService,
  LoggerService,
  QueueService,
  WebSocketService,
} from "./services";
import { Controller } from "./syncer/Controller";
import {
  Chains,
  DataTypes,
  Mode,
  ProcessCommand,
  SyncNodeConfig,
} from "./types";

class SyncNode {
  /**
   * # _serverProcess
   * @access private
   */
  private _serverProcess: ChildProcess | undefined;
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
    this._launchServerProcess();
    await this._queueService.launch();
    await this._insertionService.launch();
    await this._webSocketService.launch();

    this._config.backup.useBackup
      ? await this._queueService.loadBackup()
      : await this._queueService.clearBackup();

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

  private _launchServerProcess(): void {
    this._serverProcess = spawn("node", ["dist/server/index.js"], {
      shell: true,
      stdio: ["inherit", "inherit", "inherit", "ipc"],
    });
    this._serverProcess.on("message", (message: ProcessCommand) => {
      LoggerService.info(`Server Message: ${message}`);
      if (message.command) {
        switch (message.command) {
          case "contract_add": {
            if (message.dataType && message.contract) {
              const controller = this.getController(message.dataType);
              if (controller) {
                this.insertContract(message.contract);
                controller?.addContract(message.contract);
              } else {
                LoggerService.error(
                  `Unable to add contract, ${message.dataType} controller missing`
                );
              }
            }
            break;
          }
        }
      }
    });
    setInterval(() => {
      Object.keys(this._insertionService.insertionTally).forEach((type) => {
        this._serverProcess?.send?.({
          command: "record_insertions",
          dataType: type,
          recordCount: this._insertionService.insertionTally[type],
        });
        this._insertionService.insertionTally[type] = 0;
      });
    }, 1000 * 60 * 1);
  }
  /**
   * Returns a property from the controller's configuration.
   * @param {T} property - The property to return.
   * @returns {ControllerConfig[T]} - The value of the property.
   * @public
   */
  public getConfigProperty<T extends keyof SyncNodeConfig>(
    property: T
  ): SyncNodeConfig[T] {
    return this._config[property];
  }
  /**
   * Creates the controllers for each datatype
   * @private
   * @returns void
   */
  private _createControllers(): void {
    const { syncer } = this._config;

    if (syncer.toSync.transfers) {
      this._controllers.set(
        "transfers",
        new Controller({
          contracts: this._contracts,
          apiKey: this._config.syncer.apiKey,
          dataset: "transfers",
          type: "backfill",
          chain: this._config.syncer.chain,
          delay: 0,
          mode: this._config.syncer.mode,
        })
      );
    }

    if (syncer.toSync.sales) {
      this._controllers.set(
        "sales",
        new Controller({
          contracts: this._contracts,
          apiKey: this._config.syncer.apiKey,
          dataset: "sales",
          type: "backfill",
          chain: this._config.syncer.chain,
          delay: 0,
          mode: this._config.syncer.mode,
        })
      );
    }

    if (syncer.toSync.asks) {
      this._controllers.set(
        "asks",
        new Controller({
          contracts: this._contracts,
          apiKey: this._config.syncer.apiKey,
          dataset: "asks",
          type: "backfill",
          chain: this._config.syncer.chain,
          delay: 0,
          mode: this._config.syncer.mode,
        })
      );
    }

    if (syncer.toSync.bids) {
      this._controllers.set(
        "bids",
        new Controller({
          contracts: this._contracts,
          apiKey: this._config.syncer.apiKey,
          dataset: "bids",
          type: "backfill",
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
    contracts: readContracts(),
    sources: process.env.SOURCES ? process.env.SOURCES.split(",") : [],
    toSync: {
      transfers: process.env.SYNC_TRANSFERS === "1",
      bids: process.env.SYNC_BIDS === "1",
      asks: process.env.SYNC_ASKS === "1",
      sales: process.env.SYNC_SALES === "1",
    },
    mode: process.env.MODE as Mode,
  },
  backup: {
    useBackup: process.env.USE_BACKUP === "1",
  },
  logger: {
    datadog: {
      apiKey: process.env.DATADOG_API_KEY || "",
      appName: process.env.DATADOG_APP_NAME || "",
    },
  },
});
