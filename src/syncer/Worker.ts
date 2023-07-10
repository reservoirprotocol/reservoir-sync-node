import EventEmitter from 'events';
import { LoggerService } from '../services';
import { Block, Schemas, WorkerEvent, WorkerType } from '../types';
import {
  delay,
  getMiddleDate,
  isHighDensityBlock,
  isSuccessResponse,
  isTodayUTC,
  parseTimestamp,
  RecordRoots,
} from '../utils';

import { Controller } from './Controller';

type ControllerInstance = InstanceType<typeof Controller>;

export class Worker extends EventEmitter {
  /**
   * Public flag to determine the busy status of a worker
   * @public
   */
  public busy: boolean = false;

  /**
   * Continuation cursor to paginate through results
   * @access public
   */
  public continuation: string = '';

  /**
   * Worker type
   * @access public
   */
  public type: WorkerType = 'backfiller';

  /**
   * Request method inherited from the controller
   * @private
   */
  private readonly _request: ControllerInstance['request'];

  /**
   * Normalize parameters method inherited from the controller
   * @private
   */
  private readonly _normalize: ControllerInstance['normalize'];

  /**
   * Get config property method inhertied from the controller
   * @private
   */
  private readonly _config: ControllerInstance['getConfigProperty'];

  /**
   * Insert method inherited from the controller
   * @private
   */
  private readonly _insert: ControllerInstance['insert'];

  constructor(controller: Controller) {
    super();

    const { request, normalize, getConfigProperty, insert } = controller;

    this._insert = insert.bind(controller);
    this._request = request.bind(controller);
    this._normalize = normalize.bind(controller);
    this._config = getConfigProperty.bind(controller);
  }

  /**
   * Process a block.
   * @param {Block} block - The block to be processed.
   * @returns {Promise<void>}
   */
  public async process(block: Block): Promise<void> {
    this.type === 'backfiller' ? this._backfill(block) : this._upkeep();
  }

  private async _backfill(block: Block): Promise<void> {
    this.busy = true;
    this.continuation = '';

    const ascReq = await this._request(
      this._normalize({
        ...(block.contract && { contract: block.contract }),
        startTimestamp: parseTimestamp(block.startDate),
        endTimestamp: parseTimestamp(block.endDate),
        sortDirection: 'asc',
      })
    );

    if (!isSuccessResponse(ascReq)) {
      /**
       * Delay 5 seconds
       */
      await delay(ascReq.status === 429 ? 5000 : 0);

      return await this.process(block);
    }

    LoggerService.warn(`GRAINING BLOCK [${block.id}]`);

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const descReq = await this._request(
        this._normalize({
          ...(block.contract && { contract: block.contract }),
          startTimestamp: parseTimestamp(block.startDate),
          endTimestamp: parseTimestamp(block.endDate),
          sortDirection: 'desc',
        })
      );
      if (!isSuccessResponse(descReq)) {
        /**
         * Delay for 5 seconds if the request failed due to a 429
         */
        await delay(descReq.status === 429 ? 5000 : 0);
        continue;
      }

      const records = [
        ...ascReq.data[RecordRoots[this._config('dataset')]],
        ...descReq.data[RecordRoots[this._config('dataset')]],
      ] as Schemas;

      if (!records.length) {
        break;
      }

      if (isTodayUTC(records[records.length - 1].updatedAt)) {
        this.busy = false;
        this._release(block);
        return;
      }

      if (isHighDensityBlock(records, 365 * 24 * 60 * 60 * 1000)) {
        const middleDate = getMiddleDate(block.startDate, block.endDate);
        this._split({
          ...block,
          startDate: middleDate,
          endDate: block.endDate,
        });
        block.endDate = middleDate;
      } else {
        break;
      }
    }

    LoggerService.info(
      `GRAINED BLOCK [${block.id}] \nstartDate: ${block.startDate}\nendDate: ${block.endDate}`
    );

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await this._request(
        this._normalize({
          ...(this.continuation && { continuation: this.continuation }),
          sortDirection: 'asc',
          startTimestamp: parseTimestamp(block.startDate),
          endTimestamp: parseTimestamp(block.endDate),
        })
      );

      if (!isSuccessResponse(res)) {
        /**
         * Delay for 5 seconds if the request failed due to a 429
         */
        await delay(res.status === 429 ? 5000 : 0);
        continue;
      }

      const records = res.data[RecordRoots[this._config('dataset')]];

      if (records.length) {
        await this._insert(records);
      }

      if (!res.data.continuation) {
        this.busy = false;
        this._release(block);
        break;
      } else this.continuation = res.data.continuation;
    }
  }

  private async _upkeep(): Promise<void> {
    this.busy = true;
    this.continuation = '';

    // We upkeep by forward splitting esentially
  }

  /**
   * Emit a split event for a block.
   * @param {Block} block - The block to emit a split event for.
   */
  private _split(block: Block) {
    this.emit('worker.event', {
      type: 'worker.split',
      block,
    } as WorkerEvent);
  }
  /**
   * Emit a release event for a block.
   * @param {Block} block - The block to emit a release event for.
   */
  private _release(block: Block) {
    this.emit('worker.event', {
      type: 'worker.release',
      block: block,
    } as WorkerEvent);
  }
}
