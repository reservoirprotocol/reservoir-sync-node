// Required libraries and modules
import axios, { AxiosRequestConfig } from 'axios';
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { InsertionService } from '../services/';
import { ApiResponse, Block, ControllerEvent, Schemas } from '../types';
import { Controller } from './Controller';

// Define an empty WorkerEvent interface
interface WorkerEvent {};

/**
 * Class representing a Worker which extends EventEmitter.
 * @property _uuid - UUID of the worker
 * @property _processing - A flag indicating the processing status of the worker
 * @property _dataset - The dataset the worker is using
 * @property _root - The root dataset the worker is working with
 */
class Worker extends EventEmitter {
  /**
   * Universal Unique Identifier to use in order to identify itself with the main process
   * @private
   */
  private _uuid: string;

  /**
   * Processing flag for status of worker. Default set to false.
   * @public
   */
  public _processing: boolean = false;

  /**
   * Dataset the worker is using. Default is set to 'orders'.
   * @private
   */
  private _dataset: 'sales' | 'orders' = 'orders';

  /**
   * Root of the worker, default is set to 'sales'.
   * @private
   */
  private _root: 'sales' | 'asks' = 'sales';

  constructor(uuid: string) {
    super();
    this._uuid = uuid;
  }

  /**
   * # _process
   * Processes a block given a configuration.
   * This function is async and returns a Promise.
   */
  public async _process(block: Block): Promise<void> {
    let continuation: string = '';

    while (this._processing) {
      const res = await this._request({
        headers: {},
      });
    }
  }

  /**
   * # _request
   * Executes a request using axios.
   * This function is async and returns a Promise.
   * @param {AxiosRequestConfig} config - The configuration for the axios request.
   * @returns {Promise<ApiResponse>} - The response from the axios request.
   */
  private async _request(config: AxiosRequestConfig): Promise<ApiResponse> {
    const { data, status } = await axios.request({
      ...config,
      validateStatus: (status: number): boolean => {
        return Boolean(status);
      },
    });
    return {
      data,
      status,
    };
  }

  /**
   * # _insert
   * Inserts or updates data using the InsertionService.
   * @param {Schemas} data - The data to be inserted or updated.
   */
  private _insert(data: Schemas): void {
    InsertionService.upsert(this._root, data);
  }

  /**
   * # _split
   * Emits a split event.
   */
  private _split(): void {
    this.emit('worker.split')
  }

  /**
   * # _release
   * Releases a worker.
   */
  private _release(): void {}
}

/**
 * Class representing a pool of Workers, which extends EventEmitter.
 * @property pool - An array of Worker instances
 * @property _controller - An instance of the Controller class
 */
export class Workers extends EventEmitter {
  /**
   * An array of Worker instances.
   * @private
   */
  private pool: Worker[] = [];

  constructor(private readonly _controller: Controller) {
    super();
    this._createWorkers();

    // Register 'controller.event' event listener on Controller instance
    _controller.on('controller.event', (event: ControllerEvent) => {
      if (event.type !== 'workers') return;
      
      // Find the first processing worker in the pool
      const worker = this.pool.find(worker => worker._processing);

      if (worker) {
        worker._process(event.data.block);
      }
    });

    // Register 'worker.event' event listeners for each worker in the pool
    this.pool.forEach(worker => {
      worker.on('worker.event', (event: WorkerEvent) => {
        
      });
    });
  }

  /**
   * # _createWorkers
   * Creates workers depending on the configuration mode.
   * The function creates 15 workers if mode is 'fast',
   * 10 if it's 'normal' and 5 if it's any other mode.
   */
  private _createWorkers() {
    const mode = this._controller.getConfigProperty('mode');

    const workerCount = mode === 'fast' ? 15 : mode === 'normal' ? 10 : 5;

    for (let i = 0; i < workerCount; i++) {
      this.pool.push(new Worker(v4()));
    }
  }
}
