/* eslint-disable no-constant-condition */
/* eslint-disable no-case-declarations */
import EventEmitter from 'events';
import { InsertionService, LoggerService } from '../services';
import { Block, Schemas, SuccessResponse, WorkerEvent } from '../types';
import {
  getMiddleDate,
  isHighDensityBlock,
  isSuccessResponse,
  isTodayUTC,
  parseTimestamp,
  RecordRoots,
} from '../utils';
import { Controller } from './Controller';

interface WorkerConfig {
  request: InstanceType<typeof Controller>['request'];
  normalize: InstanceType<typeof Controller>['normalize'];
}
export class Worker extends EventEmitter {
  public processing: boolean = false;
  public onlyGrain: boolean = false;

  private _request: InstanceType<typeof Controller>['request'];
  private _normalize: InstanceType<typeof Controller>['normalize'];

  /**
   * @param {WorkerConfig} config - The configuration object for the worker.
   */
  constructor({ request, normalize }: WorkerConfig) {
    super();
    this._request = request;
    this._normalize = normalize;
  }

  /**
   * Process a block.
   * @param {Block} block - The block to be processed.
   * @returns {Promise<void>}
   */
  public async process(block: Block): Promise<void> {
    this.processing = true;
    const continuation: string = '';

    const ascRes = await this._request(
      this._getNormalizedRequest(block, 'asc')
    );

    if (!isSuccessResponse(ascRes)) return await this.process(block);

    LoggerService.warn(`Graining block: ${block.id}`);

    await this._processGraining(block, ascRes);
    this._logBlockStatus(block);
    await this._processContinuation(block, continuation);
  }
  private async _processUpkeeping(block: Block): Promise<void> {
    /**
     * What happens here is that we fire of the request with a start date of right now OR the last record if we hit a high density block
     * We fire the request and get back less than 1000 records then we just insert and keep going until we hit 1000 records
     *
     * WHEN we hit 1000 records. We need to fire off the second request to check if the block is high density.
     * IF it is high density, then the current workers startDate is the last records date. The block that gets created has a startDate of the first record/old time and an endDate of the final record/newStart time
     */

    while (true) {

    }
  }
  private async _processGraining(
    block: Block,
    ascRes: SuccessResponse
  ): Promise<void> {
    while (true || this.onlyGrain) {
      // If its set to only grain then its an upkeeper
      // When that happens the startDate is always the first record time descending
      // the end time is 30 minutes. This gives us enough time to split if needed.www

      // We fire the request and check if there are more than 1k records.
      // If there are then that means we need to check if we need to grain.

      const descRes = await this._request(
        this._getNormalizedRequest(block, 'desc')
      );

      if (!isSuccessResponse(descRes)) continue;

      const records = this._getMergedRecords(ascRes, descRes, block);

      if (!records.length) {
        break;
      }

      if (isTodayUTC(records[records.length - 1].updatedAt)) {
        this._release(block);
        break;
      }

      if (this._processHighDensity(records, block)) {
        continue;
      }

      break;
    }
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
      ...ascRes.data[RecordRoots[block.datatype]],
      ...descRes.data[RecordRoots[block.datatype]],
    ] as Schemas;
  }

  /**
   * Process high density records.
   * @param {Schemas[]} records - The records to process.
   * @param {Block} block - The block for the records.
   * @returns {boolean} - Whether the records are high density.
   */
  private _processHighDensity(records: Schemas, block: Block) {
    const isHighDensity = isHighDensityBlock(records, 1 * 60 * 60 * 1000);

    if (isHighDensity) {
      const middleDate = getMiddleDate(block.startDate, block.endDate);
      if (isTodayUTC(middleDate)) return;
      if (middleDate === block.endDate || middleDate === block.startDate)
        return;
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

      const records = res.data[RecordRoots[block.datatype]];

      await InsertionService.upsert(block.datatype, records);

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

/**
 * Set flag to primary = true
 * We insert while graining;
 * We dont ever exit the graining loop? This allows us to grain and insert. So we process the contiaunation in the graining loop? Or if we get back a continatuion do we just not process it.
 * So if the flag is primary then we never break out of the graining loop.
 *
 * So when flag upkeeping = true
 * We never process in that worker, it becomes locked to that grainer and inserts in the grainer
 */
