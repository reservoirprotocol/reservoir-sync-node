import axios, { AxiosResponse } from 'axios';
import {
  Backup,
  Block,
  ControllerConfig,
  DataSets,
  ErrorType,
  SuccessType,
  WorkerEvent,
} from 'types';
import { v4 } from 'uuid';
import { InsertionService, LoggerService, QueueService } from '../services';
import {
  delay,
  isSuccessResponse,
  RecordRoots,
  splitArray,
  UrlBase,
  UrlPaths,
  WorkerCounts,
} from '../utils';
import { Worker } from './Worker';

export class Controller {
  /**
   * Workers used to process & grain blocks.
   * @private
   */
  private readonly _workers: Worker[] = [];

  /**
   * Queue service used to handle blocks
   * @private
   */
  private readonly _queue: typeof QueueService = QueueService;

  /**
   * Configuration object for the controller
   * @private
   */
  private readonly _config: ControllerConfig;

  /**
   * UpKeep worker
   * @private
   */
  private _upkeeper: Worker | null = null;

  constructor(config: ControllerConfig) {
    this._config = config;
    this._launch();
  }

  /**
   * Creates workers and adds them to the worker array.
   * The number of workers to create is defined by the `workerCount` constant.
   * Each new worker is instantiated and added to the worker array.
   * @returns void
   * @private
   */
  private _createWorkers(): void {
    for (let i = 0; i < WorkerCounts[this._config.mode]; i++) {
      this._workers.push(new Worker(this));
    }
    this._upkeeper = new Worker(this);
  }
  /**
   * Adds a contract to the node queue
   * @param contract - Contract to add
   * @returns void
   */
  public async addContract(contract: string): Promise<void> {
    const block = await this._getInitialBlock(contract);

    await this._queue.insertBlock(block, this._config.dataset);

    LoggerService.info(
      `Added contract ${contract} to ${this._config.dataset} controller`
    );
  }

  /**
   * Gets the workers from a controller
   * @returns The workers of the controller
   */
  public getWorkers(): Worker[] {
    return this._workers;
  }

  /**
   * Launches the controller.
   * Launches the queue, creates workers, gets the initial block, assigns it to an available worker, and starts listening for worker events.
   * @returns A Promise that resolves when the controller has launched.
   * @private
   */
  private async _launch(): Promise<void> {
    this._createWorkers();
    this._listen();

    const backup = this._queue.getBackup(this._config.dataset);

    if (backup) {
      this._launchBackup(backup);
    } else {
      if (this._config.contracts.length > 0) {
        this._handleContracts();
      } else {
        const worker = this._workers.find(({ busy }) => !busy) as Worker;
        const block = await this._getInitialBlock();
        worker.process(block);
      }
    }

    this._upkeeper?.upkeep();
    this._queue.backup(this._config.dataset, this._workers);
  }
  private async _launchBackup(backup: Backup): Promise<void> {
    for (const { block, continuation } of backup.workers) {
      for await (const worker of this._workers) {
        worker.process(
          {
            ...block,
          },
          continuation ? false : true
        );
        await delay(30000);
      }
    }
  }

  private async _handleContracts(): Promise<void> {
    const blocks: Block[] = [];
    const chunks: string[][] = splitArray(this._config.contracts, 4);

    let i: number = 0;
    for await (const chunk of chunks) {
      for (const contract of chunk) {
        await delay(1000);
        const block = await this._getInitialBlock(contract);
        blocks.push(block);
        i++;
        LoggerService.info(
          `${i}/${this._config.contracts.length} Blocks created`
        );
      }

      await delay(5000);
    }

    for (const block of blocks) {
      const worker = this._workers.find(({ busy }) => !busy) as Worker;
      if (!worker) {
        this._queue.insertBlock(block, this._config.dataset);
        continue;
      } else {
        worker.process(block);
      }
    }
  }
  /**
   * Sets up listeners for worker events.
   *
   * Each worker in the worker array is assigned an event listener that handles worker events.
   *
   * @private
   */
  private _listen(): void {
    this._workers.forEach((worker) => {
      worker.on('worker.event', this._handleWorkerEvent.bind(this));
    });
    this._upkeeper?.on('worker.event', this._handleWorkerEvent.bind(this));
  }
  /**
   * Handles a worker event.
   *
   * Depending on the event type, it either handles a block split or releases a worker.
   * If the event type is unknown, it throws an error.
   *
   * @param {Object} event - The event object from the worker.
   * @param {string} event.type - The type of the event.
   * @param {Block} event.block - The block associated with the event (if applicable).
   * @throws Will throw an error if the event type is unknown.
   * @private
   */
  private async _handleWorkerEvent({
    type,
    block,
  }: WorkerEvent): Promise<void> {
    switch (type) {
      case 'worker.split':
        this._handleBlockSplit(block);
        break;
      case 'worker.release':
        this._delegate();
        break;
      default:
        throw new Error(`UNKOWN EVENT: ${type}`);
    }
    this._queue.backup(this._config.dataset, this._workers);
  }

  /**
   * Handles a block split by creating a new block and inserting it into the queue.
   * Delegates further actions after the block is inserted.
   *
   * @param block - The original block to be split.
   * @private
   */
  private async _handleBlockSplit(block: Block): Promise<void> {
    const newBlock: Block = {
      ...block,
      id: v4(),
    };
    await this._queue.insertBlock(newBlock, this._config.dataset);
    this._delegate();
  }
  /**
   * Requests the initial block from the API.
   * @returns {Promise<Block>} - The initial block.
   * @private
   */
  private async _getInitialBlock(contract?: string): Promise<Block> {
    const reqs = await Promise.all([
      this.request(
        this.normalize({
          ...(contract && { contract }),
          sortDirection: 'asc',
        })
      ),
      this.request(
        this.normalize({
          ...(contract && { contract }),
          sortDirection: 'desc',
        })
      ),
    ]);

    if (!isSuccessResponse(reqs[0]) || !isSuccessResponse(reqs[1]))
      throw new Error(
        `Intiailizing blocks failed: ${reqs.map(
          (r, i) => `${r.status}:${i} ${contract ?? contract}`
        )}`
      );

    const root = RecordRoots[this._config.dataset];

    return {
      id: v4(),
      priority: 1,
      startDate: reqs[0].data[root][reqs[0].data[root].length - 1].updatedAt,
      endDate: reqs[1].data[root][reqs[1].data[root].length - 1].updatedAt,
      contract: contract || '',
    };
  }
  /**
   * Delegates blocks from the queue to available workers.
   * @returns A Promise that resolves when a block has been assigned to a worker or when all workers are busy.
   * @private
   */
  private async _delegate(): Promise<void> {
    const worker = this._workers.find(({ busy }) => !busy);

    if (!worker) return;

    worker.busy = true;

    const block = await this._queue.getBlock(this._config.dataset);

    if (!block) {
      worker.busy = false;
      return;
    }

    worker.process(block);
  }
  /**
   * Inserts or updates a data set using the InsertionService.
   * @param data - The data to be inserted or updated.
   * @returns A Promise that resolves when the data has been inserted or updated.
   * @public
   */
  public async insert(data: DataSets): Promise<void> {
    return InsertionService.upsert(this._config.dataset, data);
  }
  /**
   * Normalizes the parameters for the API request.
   * @param {Record<string | number, unknown>} params - The parameters to be normalized.
   * @returns {string} - The normalized parameters.
   * @private
   */
  public normalize(params: Record<string | number, unknown>): string {
    const queries: string[] = ['limit=1000', 'includeCriteriaMetadata=true'];

    const root = RecordRoots[this._config.dataset];

    queries.push(root === 'sales' ? 'orderBy=updated_at' : 'sortBy=updatedAt');

    Object.keys(params).map((key) => queries.push(`${key}=${params[key]}`));

    return queries.join('&');
  }
  /**
   * Makes a request to the API.
   * @param {string} parameters - The parameters for the API request.
   * @returns {Promise<AxiosResponse<SuccessType | ErrorType>>} - The response from the API.
   * @private
   */
  public async request(
    parameters: string
  ): Promise<AxiosResponse<SuccessType | ErrorType>> {
    try {
      const req = await axios<SuccessType | ErrorType>({
        ...this._config,
        url: `${UrlBase[this._config.chain]}${
          UrlPaths[this._config.dataset]
        }?${parameters}`,
        validateStatus: () => true,
        headers: {
          'X-API-KEY': this._config.apiKey,
          'X-SYNC-NODE': 'V2',
          'Content-Type': 'application/json',
        },
      });
      return {
        ...req,
        data: req.data,
      };
    } catch (e: unknown) {
      return await this.request(parameters);
    }
  }

  /**
   * Returns a property from the controller's configuration.
   * @param {T} property - The property to return.
   * @returns {ControllerConfig[T]} - The value of the property.
   * @public
   */
  public getConfigProperty<T extends keyof ControllerConfig>(
    property: T
  ): ControllerConfig[T] {
    return this._config[property];
  }
}
