import axios, { AxiosResponse } from 'axios';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import {
  Block,
  ControllerConfig,
  ControllerEvent,
  ErrorType,
  QueueEvent,
  SuccessType
} from '../types';
import { isSuccessResponse } from '../utils';
import { Queue } from './Queue';
import { Workers } from './Workers';

// Constant for API base URLs
const UrlBase = {
  mainnet: 'https://api.reservoir.tools',
  goerli: 'https://api-goerli.reservoir.tools',
} as const;

// Constant for API path URLs
const UrlPaths = {
  sales: '/sales/v4',
  asks: '/orders/asks/v4',
  bids: '/orders/bids/v5',
} as const;

interface WorkersEvent { }

/**
 * Class representing a Controller. It extends EventEmitter.
 * The Controller class handles the events from the queue and workers.
 * @property _queue - An instance of the Queue class.
 * @property _workers - An instance of the Workers class.
 * @property config - Configuration object for the Controller.
 */
export class Controller extends EventEmitter {
  /**
   * # _queue
   * Instance of Queue class.
   * @private
   */
  private _queue: Queue;

  /**
   * # _workers
   * Instance of Workers class.
   * @private
   */
  private _workers: Workers;

  /**
   * Constructor for the Controller class.
   * @param {ControllerConfig} config - The configuration for the Controller.
   */
  constructor(private readonly config: ControllerConfig) {
    super();

    this._queue = new Queue(this);
    this._workers = new Workers(this);

    // Register 'queue.event' event listener on Queue instance
    this._queue.on('queue.event', this._handleQueueEvent.bind(this));

    // Register 'workers.event' event listener on Workers instance
    this._workers.on('workers.event', this._handleWorkersEvent.bind(this));

    this._launch();
  }

  /**
   * Handles the workers' events.
   * @param {WorkersEvent} event - The event triggered by the workers.
   * @private
   */
  private async _handleWorkersEvent(event: WorkersEvent): Promise<void> { }

  /**
   * Handles the queue's events.
   * @param {QueueEvent} event - The event triggered by the queue.
   * @private
   */
  private async _handleQueueEvent(event: QueueEvent): Promise<void> {
    switch (event.type) {
      case 'new.block':
        this.emit('controller.event', {
          type: 'workers',
          data: {
            block: event.block,
          },
        } as ControllerEvent);
        break;
      default:
        throw new Error(`Unknown queue event: ${event.type}`);
    }
  }

  /**
   * Starts the controller by emitting the first event.
   * @private
   */
  private async _launch(): Promise<void> {
    const block: Block = await this._getInitialBlock();

    console.log(block);

    this.emit('controller.event', {
      type: 'queue',
      data: {
        block: block,
      },
    } as ControllerEvent);
  }

  /**
   * Normalizes the parameters for the API request.
   * @param {Record<string | number, unknown>} params - The parameters to be normalized.
   * @returns {string} - The normalized parameters.
   * @private
   */
  public normalizeParameters(
    params: Record<string | number, unknown>
  ): string {
    const queries: string[] = ['limit=1000', 'includeCriteriaMetadata=true'];

    const { root } = this.config.mapping.type;

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
        this.normalizeParameters({
          sortDirection: 'asc',
        })
      ),
      this.request(
        this.normalizeParameters({
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
      startDate:
        reqs[0].data[this.config.mapping.type.root][
          reqs[0].data[this.config.mapping.type.root].length - 1
        ].updatedAt,
      endDate:
        reqs[1].data[this.config.mapping.type.root][
          reqs[1].data[this.config.mapping.type.root].length - 1
        ].updatedAt,
      contract: '',
    }
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
      console.log(`${UrlBase[this.config.chain]}${UrlPaths[this.config.mapping.type.dataset]
        }?${parameters}`);
      const req = await axios<SuccessType | ErrorType>({
        ...this.config,
        url: `${UrlBase[this.config.chain]}${UrlPaths[this.config.mapping.type.dataset]
          }?${parameters}`,
        validateStatus: (_status: number) => true,
        headers: {
          'X-API-KEY': this.config.apiKey,
          'X-SYSTEM-TYPE': 'sync-node',
          'Content-Type': 'application/json',
        },
      });
      req.data;
      return {
        ...req,
        data: req.data,
      };
    } catch (e: unknown) {
      throw new Error(`Request failed with error: ${e}`);
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
    return this.config[property];
  }
}
