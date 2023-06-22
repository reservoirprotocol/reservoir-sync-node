// Required libraries and modules
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { Block, ControllerEvent } from '../types';
import { isSuccessResponse, parseTimestamp } from '../utils';
import { Controller } from './Controller';

// Define an empty WorkerEvent interface
interface WorkerEvent { };

interface WorkerConfig {
  id: string;
  request: InstanceType<typeof Controller>['request'];
  insert: InstanceType<typeof Controller>['request'];
  normalize: InstanceType<typeof Controller>['normalizeParameters'];
}

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
  private _id: string;

  /**
   * Processing flag for status of worker. Default set to false.
   * @public
   */
  public _processing: boolean = false;

  private _request: InstanceType<typeof Controller>['request'];

  private _insert: InstanceType<typeof Controller>['request'];

  private _normalize: InstanceType<typeof Controller>['normalizeParameters'];

  constructor({ id, request, insert, normalize }: WorkerConfig) {
    super();
    this._id = id;
    this._request = request;
    this._insert = insert;
    this._normalize = normalize;
  }

  /**
   * # _process
   * Processes a block given a configuration.
   * This function is async and returns a Promise.
   */
  public async _process({ startDate, endDate, id, }: Block): Promise<void> {
    this._processing = true;
    let continuation: string = '';

    // Get the startTimestamps from the dates
    console.log(`Processing block: ${id}`);

    console.log(parseTimestamp(startDate));
    console.log(parseTimestamp(endDate));

    while (this._processing) {
      const res = await this._request(this._normalize({
        startTimestamp: parseTimestamp(startDate).startTimestamp,
        endTimestamp: parseTimestamp(endDate).endTimestamp,
      }));
      console.log(res.status);

      if (!isSuccessResponse(res)) continue;
      console.log(res.data);
      console.log(res.data.sales[0].updatedAt);
      console.log(res.data.sales[res.data.sales.length - 1].updatedAt);



      await new Promise(r => setTimeout(r, 1000));



    }
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
  private _release(): void { }
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
      console.log(`Got worker event`);
      // Find the first processing worker in the pool
      const worker = this.pool.find(worker => !worker._processing);
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
      this.pool.push(new Worker({
        id: v4(),
        request: this._controller.request.bind(this._controller),
        insert: this._controller.request.bind(this._controller),
        normalize: this._controller.normalizeParameters.bind(this._controller),
      }));
    }
  }
}
