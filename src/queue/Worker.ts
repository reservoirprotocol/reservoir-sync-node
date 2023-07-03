/* eslint-disable no-constant-condition */
/* eslint-disable no-case-declarations */
import EventEmitter from 'events';
import { InsertionService, LoggerService } from '../services';
import { Block, Schemas, SuccessResponse } from '../types';
import {
  getMiddleDate,
  isHighDensityBlock,
  isSuccessResponse,
  parseTimestamp,
} from '../utils';
import { Controller } from './Controller';

interface WorkerEvent {
  type: 'worker.release' | 'block.split' | 'block.status';
  block: Block | null;
}

export class Worker extends EventEmitter {
  public processing: boolean = false;

  private _request: InstanceType<typeof Controller>['request'];
  private _insert: InstanceType<typeof Controller>['request'];
  private _normalize: InstanceType<typeof Controller>['normalize'];

  /**
   * @param {WorkerConfig} config - The configuration object for the worker.
   */
  constructor(controller: Controller) {
    super();

    this._request = controller.request.bind(controller);
    this._insert = controller.request.bind(controller);
    this._normalize = controller.normalize.bind(controller);
  }

  /**
   * Process a block.
   * @param {Block} block - The block to be processed.
   * @returns {Promise<void>}
   */
  public async process(block: Block): Promise<void> {
    this.processing = true;
    const continuation: string = '';

    LoggerService.warn(`Graining block: ${block.id}`);
    while (true) {
      const [ascRes, descRes] = await this._getResponses(block);

      if (!isSuccessResponse(ascRes) || !isSuccessResponse(descRes)) continue;

      const records = this._getMergedRecords(ascRes, descRes, block);

      if (!records.length) {
        break;
      }

      if (this._processHighDensity(records, block)) {
        continue;
      }

      break;
    }

    this._logBlockStatus(block);
    await this._processContinuation(block, continuation);
  }

  /**
   * Get responses for both ascending and descending request.
   * @param {Block} block - The block to get responses for.
   * @returns {Promise<any[]>} - The responses for both ascending and descending request.
   */
  private async _getResponses(block: Block) {
    return await Promise.all([
      this._request(this._getNormalizedRequest(block, 'asc')),
      this._request(this._getNormalizedRequest(block, 'desc')),
    ]);
  }

  /**
   * Get normalized request.
   * @param {Block} block - The block to get normalized request for.
   * @param {string} direction - The direction for the request.
   * @returns {any} - The normalized request.
   */
  private _getNormalizedRequest(block: Block, direction: string) {
    return this._normalize({
      ...(block.contract && { contract: block.contract }),
      startTimestamp: parseTimestamp(block.startDate),
      endTimestamp: parseTimestamp(block.endDate),
      sortDirection: direction,
    });
  }

  /**
   * Merge records from ascending and descending responses.
   * @param {any} ascRes - The response from ascending request.
   * @param {any} descRes - The response from descending request.
   * @param {Block} block - The block to get merged records for.
   * @returns {Schemas[]} - The merged records.
   */
  private _getMergedRecords(
    ascRes: SuccessResponse,
    descRes: SuccessResponse,
    block: Block
  ): Schemas {
    return [
      ...ascRes.data[block.mapping.type.root],
      ...descRes.data[block.mapping.type.root],
    ] as Schemas;
  }

  /**
   * Process high density records.
   * @param {Schemas[]} records - The records to process.
   * @param {Block} block - The block for the records.
   * @returns {boolean} - Whether the records are high density.
   */
  private _processHighDensity(records: Schemas, block: Block) {
    const isHighDensity = isHighDensityBlock(records, 10 * 60 * 1000);

    if (isHighDensity) {
      const middleDate = getMiddleDate(block.startDate, block.endDate);
      this._split({
        ...block,
        startDate: middleDate,
        endDate: block.endDate,
      });

      block.endDate = middleDate;
      return true;
    }

    return false;
  }

  /**
   * Log block status.
   * @param {Block} block - The block to log status for.
   */
  private _logBlockStatus(block: Block) {
    LoggerService.info(
      `Grained block: ${block.id}\nstartDate: ${block.startDate}\nendDate: ${block.endDate}`
    );
  }

  /**
   * Process continuation for a block.
   * @param {Block} block - The block to process continuation for.
   * @param {string} continuation - The continuation string.
   * @returns {Promise<void>}
   */
  private async _processContinuation(block: Block, continuation: string) {
    while (true) {
      const res = await this._request(
        this._normalize({
          ...(continuation && { continuation }),
          sortDirection: 'asc',
          startTimestamp: parseTimestamp(block.startDate),
          endTimestamp: parseTimestamp(block.endDate),
        })
      );

      if (!isSuccessResponse(res)) continue;

      const records = res.data[block.mapping.type.root];

      await InsertionService.upsert(block.mapping.datasets, records);

      if (!records.length || !res.data.continuation) {
        this.processing = false;
        this._release(block);
        break;
      }

      continuation = res.data.continuation;
    }
  }

  /**
   * Emit a split event for a block.
   * @param {Block} block - The block to emit a split event for.
   */
  private _split(block: Block) {
    this.emit('worker.event', {
      type: 'block.split',
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
