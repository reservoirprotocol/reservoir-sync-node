/* eslint-disable no-constant-condition */
/* eslint-disable no-case-declarations */
import EventEmitter from 'events';
import { v4 } from 'uuid';
import { InsertionService, LoggerService } from '../services';
import { Block, Schemas } from '../types';
import {
  getMiddleDate,
  isHighDensityBlock,
  isSuccessResponse,
  parseTimestamp,
} from '../utils';
import { Controller } from './Controller';

interface WorkerConfig {
  id: string;
  request: InstanceType<typeof Controller>['request'];
  insert: InstanceType<typeof Controller>['request'];
  normalize: InstanceType<typeof Controller>['normalizeParameters'];
}
interface WorkerEvent {
  type: 'block.release' | 'block.split' | 'block.status';
  block: Block | null;
}
interface ControllerEvent {
  type: 'block.added';
}
interface ManagerEvent {
  type: 'workers.busy';
}

class Worker extends EventEmitter {
  /**
   * Processing flag for status of worker. Default set to false.
   * @access public
   */
  public processing: boolean = false;

  /**
   * Request method inherited from the controller.
   * Handles sending requests to the API
   * @access private
   */
  private _request: InstanceType<typeof Controller>['request'];

  /**
   * Insertion method inherited from the controller.
   *  Handles inserting records.
   * @access private
   */
  private _insert: InstanceType<typeof Controller>['request'];

  /**
   * Normalize method inherited from the controller.
   * Handles normalizing query parameters.
   * @access private
   */
  private _normalize: InstanceType<typeof Controller>['normalizeParameters'];

  constructor({ request, insert, normalize }: WorkerConfig) {
    super();

    this.processing = false;

    this._request = request;
    this._insert = insert;
    this._normalize = normalize;
  }

  /**
   * Process a block by splitting and then fetching all the data.
   * @param block - startDate, endDate, id, mapping, contract
   */
  public async process(block: Block): Promise<void> {
    const {
      startDate,
      id,
      mapping: {
        datasets,
        type: { root },
      },
      contract,
    } = block;

    this.processing = true;
    let continuation: string = '';
    let count: number = 0;
    let endDate = block.endDate;

    LoggerService.warn(`Graining block: ${id}`);
    while (true) {
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

      if (!isSuccessResponse(reqs[0]) || !isSuccessResponse(reqs[1])) continue;

      const records = [...reqs[0].data[root], ...reqs[1].data[root]] as Schemas;

      if (!records.length) {
        break;
      }

      const isHighDensity = isHighDensityBlock(records, 10 * 60 * 1000);

      if (isHighDensity) {
        const middleDate = getMiddleDate(startDate, endDate);
        this._split({ ...block, startDate: middleDate, endDate });

        endDate = middleDate;
        continue;
      }
      if (!isHighDensity) {
        break;
      }
    }

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

      const records = res.data[root];

      count += records.length;

      await InsertionService.upsert(datasets, records);

      if (!records.length) {
        this.processing = false;
        this._release(id);
        break;
      }

      if (!res.data.continuation) {
        this.processing = false;
        this._release(id);
        break;
      }

      continuation = res.data.continuation;
      continue;
    }
    LoggerService.info(
      `Completed block: ${id}\nTotal Record Count: ${count}\nStart Date: ${startDate}\nEndDate ${endDate}`
    );
  }

  /**
   * Emits a split event to the manager
   * @param id BlockId
   * @param dates - startDate & endDate
   */
  private _split(block: Block): void {
    this.emit('worker.event', {
      type: 'block.split',
      block,
    } as WorkerEvent);
  }
  /**
   * # _release
   * Releases a worker.
   */
  private _release(id: string): void {
    this.emit('worker.event', {
      type: 'block.release',
      block: {
        id,
      },
    } as WorkerEvent);
  }
}

export class Manager extends EventEmitter {
  /**
   * Pool of workers
   * @access private
   * @readonly
   */
  private readonly _pool: Worker[] = [];

  /**
   * Controller instance
   * @access private
   * @readonly
   */
  private readonly _controller: Controller;

  constructor(controller: Controller) {
    super();
    this._controller = controller;
    this._launch();
  }
  /**
   * Launches the manager and sets the listeners
   * @access private
   */
  private _launch(): void {
    this._controller.on(
      'controller.event',
      this._handleControllerEvent.bind(this)
    );

    this._pool.forEach((worker) => {
      worker.on('worker.event', this._handleWorkerEvent.bind(this));
    });
  }
  private _handleControllerEvent({ type }: ControllerEvent): void {
    switch (type) {
      case 'block.added':
        const worker = this._pool.find(({ processing }) => !processing);

        if (worker) {
          const block = this._controller.queue._getBlock();
          block && worker.process(block);
        } else {
          this.emit('manager.event', {
            type: 'workers.busy',
          } as ManagerEvent);
        }
        break;
    }
  }

  private _handleWorkerEvent({ type, block }: WorkerEvent): void {
    if (!block) return;
    switch (type) {
      case 'block.release':
        // Workers free
        break;
      case 'block.split':
        return this._blockSplit(block);
        break;
      case 'block.status':
        // Workers logging
        break;
    }
  }
  private _blockSplit({ startDate, endDate, contract, mapping }: Block): void {
    this._controller.queue._insertBlock({
      id: v4(),
      startDate,
      endDate,
      contract,
      mapping,
    } as Block);

    this;
  }
  /**
   * Creates the pool of workers
   * @access private
   */
  private _createWorkers(): void {
    const mode = this._controller.getConfigProperty('mode');

    const workerCount = mode === 'fast' ? 15 : mode === 'normal' ? 10 : 5;

    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker({
        id: v4(),
        request: this._controller.request.bind(this._controller),
        insert: this._controller.request.bind(this._controller),
        normalize: this._controller.normalizeParameters.bind(this._controller),
      });
      this._pool.push(worker);
    }
  }
}
