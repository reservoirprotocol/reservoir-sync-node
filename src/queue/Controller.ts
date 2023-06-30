import axios, { AxiosResponse } from 'axios';
import { InsertionService } from 'services';
import { v4 } from 'uuid';
import {
  Block,
  ControllerConfig,
  DataSets,
  ErrorType,
  SuccessType,
} from '../types';
import { isSuccessResponse } from '../utils';
import { Queue } from './Queue';
import { Worker } from './Worker';

const UrlBase = {
  mainnet: 'https://api.reservoir.tools',
  goerli: 'https://api-goerli.reservoir.tools',
} as const;

const UrlPaths = {
  sales: '/sales/v4',
  asks: '/orders/asks/v4',
  bids: '/orders/bids/v5',
} as const;

interface WorkerEvent {
  type: string;
  block: Block;
}

export class Controller {
  private _config: ControllerConfig;

  private _queue: Queue = new Queue();
  private _workers: Worker[] = [];

  constructor(config: ControllerConfig) {
    this._config = config;
    this._launch();
  }
  private _createWorkers(): void {
    const workerCount =
      this._config.mode === 'fast'
        ? 15
        : this._config.mode === 'normal'
        ? 10
        : 5;

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(this);
      this._workers.push(worker);
    }
  }
  /**
   * Starts the controller by emitting the first event.
   * @private
   */
  private async _launch(): Promise<void> {
    this._createWorkers();

    const block: Block = await this._getInitialBlock();

    const worker = this._workers.find(
      ({ processing }) => !processing
    ) as Worker;

    worker.process(block);

    this._listen();
  }
  private _listen(): void {
    this._workers.forEach(({ on }) => {
      on('worker.event', this._handleWorkerEvent.bind(this));
    });
  }
  private _handleWorkerEvent({ type, block }: WorkerEvent): void {
    switch (type) {
      case 'worker.split':
        return this._handleWorkerSplit(block);
      case 'worker.release':
        return this.handleWorkerRelease();
      default:
        throw new Error(`Unknown event: ${type}`);
    }
  }
  private handleWorkerRelease(): void {
    const worker = this._workers.find(({ processing }) => !processing);
    if (!worker) return;

    const block = this._queue._getBlock();
    if (!block) return;

    worker.process(block);
  }
  private _handleWorkerSplit(block: Block): void {
    const newBlock: Block = {
      ...block,
      id: v4(),
    };
    this._queue._insertBlock(newBlock);
  }

  public async insert(data: DataSets): Promise<void> {
    return InsertionService.upsert(this._config.mapping.datasets, data);
  }
  /**
   * Normalizes the parameters for the API request.
   * @param {Record<string | number, unknown>} params - The parameters to be normalized.
   * @returns {string} - The normalized parameters.
   * @private
   */
  public normalize(params: Record<string | number, unknown>): string {
    const queries: string[] = ['limit=1000', 'includeCriteriaMetadata=true'];

    const { root } = this._config.mapping.type;

    queries.push(root === 'sales' ? 'orderBy=updated_at' : 'sortBy=updatedAt');

    Object.keys(params).map((key) => queries.push(`${key}=${params[key]}`));

    return queries.join('&');
  }

  /**
   * Requests the initial block from the API.
   * @returns {Promise<Block>} - The initial block.
   * @private
   */
  private async _getInitialBlock(): Promise<Block> {
    const reqs = await Promise.all([
      this.request(
        this.normalize({
          sortDirection: 'asc',
        })
      ),
      this.request(
        this.normalize({
          sortDirection: 'desc',
        })
      ),
    ]);

    if (!isSuccessResponse(reqs[0]) || !isSuccessResponse(reqs[1]))
      throw new Error(
        `Intiailizing blocks failed: ${reqs.map((r, i) => `${r.status}:${i}`)}`
      );

    return {
      id: v4(),
      mapping: this._config.mapping,
      startDate:
        reqs[0].data[this._config.mapping.type.root][
          reqs[0].data[this._config.mapping.type.root].length - 1
        ].updatedAt,
      endDate:
        reqs[1].data[this._config.mapping.type.root][
          reqs[1].data[this._config.mapping.type.root].length - 1
        ].updatedAt,
      contract: '',
    };
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
          UrlPaths[this._config.mapping.type.dataset]
        }?${parameters}`,
        validateStatus: () => true,
        headers: {
          'X-API-KEY': this._config.apiKey,
          'X-SYSTEM-TYPE': 'sync-node',
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
