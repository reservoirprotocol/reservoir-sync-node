/* eslint-disable no-constant-condition */
// Required libraries and modules
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { InsertionService, LoggerService } from '../services';
import { Block, ControllerEvent, Schemas } from '../types';
import { getMiddleDate, isSuccessResponse, parseTimestamp } from '../utils';
import { Controller } from './Controller';

// Determine density
// Days
//const threshold = 0.5 * 24 * 60 * 60 * 1000; // To convert to
// Hours
// const threshold = 0.5 * 60 * 60 * 1000;
// Minutes
// const threshold = 1 * 60 * 100;
// Seconds 15 seconds
// const threshold = 1 * 1000;

type WorkerEventType = 'block.split' | 'worker.release';
// Define an empty WorkerEvent interface
interface WorkerEvent {
  id: string;
  type: WorkerEventType;
  data: {
    startDate: string;
    endDate: string;
  };
}

interface WorkerConfig {
  id: string;
  request: InstanceType<typeof Controller>['request'];
  insert: InstanceType<typeof Controller>['request'];
  normalize: InstanceType<typeof Controller>['normalizeParameters'];
}
interface SplitDates {
  startDate: string;
  endDate: string;
}

/**
 * Determines the density of the data based on the 'updated_at' date of the first and last record.
 * The data is considered high density if the time difference between the first and last record is less than the provided threshold.
 *
 * @param {Object[]} data - The array of data objects to check.
 * @param {number} threshold - The maximum time difference in milliseconds to be considered as high-density data.
 * @returns {boolean} Returns true if the data is high density, false otherwise.
 */
function isHighDensityBlock(data: Schemas, threshold: number) {
  const dateOne = new Date(data[0].updatedAt).getTime();
  const dateTwo = new Date(data[data.length - 1].updatedAt).getTime();
  return Math.abs(dateOne - dateTwo) > threshold;
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
  public async _process({
    startDate,
    endDate,
    id,
    mapping,
    contract,
  }: Block): Promise<void> {
    const { root, dataset } = mapping.type;

    this._processing = true;
    let continuation: string = '';
    let count: number = 0;

    // Split block loop
    LoggerService.warn(`Graining block: ${id}`);
    while (true) {
      // These two requests help us determine the density of the block
      const reqs = await Promise.all([
        this._request(
          this._normalize({
            ...(contract && { contract }),
            startTimestamp: parseTimestamp(startDate),
            endTimestamp: parseTimestamp(endDate),
            sortDirection: 'asc',
          })
        ),
        this._request(
          this._normalize({
            ...(contract && { contract }),
            startTimestamp: parseTimestamp(startDate),
            endTimestamp: parseTimestamp(endDate),
            sortDirection: 'desc',
          })
        ),
      ]);

      // If they werent successfull then we go back to the start
      if (!isSuccessResponse(reqs[0]) || !isSuccessResponse(reqs[1])) continue;

      // Concact the records together
      const records = [...reqs[0].data[root], ...reqs[1].data[root]] as Schemas;

      // Does this even make sense? In what case would we get back no records?
      if (!records.length) {
        break;
      }

      // Check if the first record updatedAt is 10 minutes or less than the last record updatedAt
      const thresholds = {
        minute: 60 * 1000, // 60 seconds * 1000 milliseconds
        hour: 60 * 60 * 1000, // 60 minutes * 60 seconds * 1000 milliseconds
        day: 24 * 60 * 60 * 1000, // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
        month: 30 * 24 * 60 * 60 * 1000, // Assuming an average month has 30 days
        year: 365.25 * 24 * 60 * 60 * 1000, // Accounting for leap years
      };

      // 1st block 2018 -> 2023
      // split
      // 2nd block 2019 -> 2023
      // 1st 2018 -> 2019

      const isHighDensity = isHighDensityBlock(records, 1000);

      // If it is high density then that means we request that this block be split
      if (isHighDensity) {
        // The start date of the block that gets pushed into the queue is the middle point
        const middleDate = getMiddleDate(startDate, endDate);
        // Split the block from the new start date and the old end date
        this._split(id, {
          startDate: middleDate,
          endDate,
        });

        // 2018 2023
        // 2018 2020
        // 2018Jan 2018 Dec
        // 2018 1:00 2018 1:10
        // We set the endDate to the startDate of the new block (middle date)
        endDate = middleDate;
        continue; // We restart the loop
      }

      /**
       * Bring up to pedro during 1 on 1
       */
      // If its not high density then that means we have two timestamps that have a difference of less than 10 minutes
      // between their entire records
      if (!isHighDensity) {
        break;
      }
    }

    // Process block loop
    LoggerService.info(
      `Grained block: ${id}\nstartDate: ${startDate}\nendDate: ${endDate}`
    );
    while (true) {
      const res = await this._request(
        this._normalize({
          ...(continuation && { continuation }),
          sortDirection: 'asc',
          startTimestamp: parseTimestamp(startDate),
          endTimestamp: parseTimestamp(endDate),
        })
      );

      if (!isSuccessResponse(res)) continue;

      const records = res.data[mapping.type.root];

      count += records.length;

      await InsertionService.upsert(dataset, records);

      if (!records.length) {
        this._processing = false;
        this._release(id);
        break;
      }

      // We've processed the entire data for that block
      if (!res.data.continuation) {
        this._processing = false;
        this._release(id);
        break;
      }

      // Set the new continuation and restart
      continuation = res.data.continuation;
      continue;
    }
    LoggerService.info(
      `Completed block: ${id}\nTotal Record Count: ${count}\nStart Date: ${startDate}\nEndDate ${endDate}`
    );
  }
  /**
   * # _split
   * Emits a split event.
   */
  private _split(id: string, dates: SplitDates): void {
    // We split the the block but we also dont return so that we can keep working on the block we are currently on
    this.emit('worker.event', {
      id,
      type: 'block.split',
      data: {
        startDate: dates.startDate,
        endDate: dates.endDate,
      },
    } as WorkerEvent);
  }

  /**
   * # _release
   * Releases a worker.
   */
  private _release(id: string): void {
    this.emit('worker.event', {
      id,
      type: 'worker.release',
    } as WorkerEvent);
  }
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

    _controller.on('controller.event', (event: ControllerEvent) => {
      event;
      const worker = this.pool.find((worker) => !worker._processing);

      if (worker) {
        const block = this._controller._queue._getBlock();
        if (!block) {
          return;
        }
        worker._process(block);
      } else {
        this.emit('workers.event', {
          type: 'busy',
        }); // We emit this back to the controller and it sleeeps for a second OR gets pinged when a worker is free.
      }
    });

    // Register 'worker.event' event listeners for each worker in the pool
    this.pool.forEach((worker) => {
      worker.on('worker.event', (event: WorkerEvent) => {
        this.emit('workers.event', event);
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

    for (let i = 0; i < 25; i++) {
      this.pool.push(
        new Worker({
          id: v4(),
          request: this._controller.request.bind(this._controller),
          insert: this._controller.request.bind(this._controller),
          normalize: this._controller.normalizeParameters.bind(
            this._controller
          ),
        })
      );
    }
  }
}
