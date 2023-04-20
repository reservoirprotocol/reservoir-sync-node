import { isToday } from 'date-fns';
import { Counts, Status, WorkerConfig } from '../types';
import { isSuccessResponse } from '../utils';

export class SyncerWorker {
  /**
   * # status
   * A status string that indicates what the sync status of the worker
   * @access private
   * @type {Status}
   */
  public status: Status = 'backfilling';

  /**
   * # backfilled
   * A backfill flag that indicates if the worker has reached the present
   * @access public
   * @type {Boolean}
   */
  public backfilled: boolean;

  /**
   * # isBusy
   * A busy flag that indicates if the worker can recieve new work
   * @access public
   * @type {Boolean}
   */
  public isBusy: boolean;
  /**
   * # _continuation
   * The continuation token to use for pagination
   * @access private
   * @type {String}
   */
  private _continuation: string = '';

  /**
   * # _lastRecordId
   * The last records identifier
   * @access private
   * @type {String}
   */
  private _lastRecordId: string = '';

  /**
   * # counts
   * Request & Insertion counts that the worker has handled
   * @access private
   * @type {Counts}
   */
  public counts: Counts = {
    _insertions: 0,
    insertions: 0,
    _requests: {
      '2xx': 0,
      '4xx': 0,
      '5xx': 0,
    },
    requests: {
      '2xx': 0,
      '4xx': 0,
      '5xx': 0,
    },
  };
  /**
   * # config
   * Worker config
   * @access public
   * @type {WorkerConfig}
   */
  public config: WorkerConfig;

  constructor(_config: WorkerConfig) {
    this.config = _config;
    this.backfilled = false;
    this.isBusy = false;
  }
  /**
   * # launch
   * Launches a sync worker
   * @access public
   * @returns {Promise<void>} Promise void
   */
  public async launch(): Promise<void> {
    return new Promise<void>(async (resolve): Promise<void> => {
      this.isBusy = true;
      while (true) {
        const _res = await this.config.request({
          continuation: this._continuation,
          date: this.config.date,
        });

        this.counts._requests[
          `${_res.status.toString().split('')[0]}xx` as keyof Counts['requests']
        ]++;
        this.counts.requests[
          `${_res.status.toString().split('')[0]}xx` as keyof Counts['requests']
        ]++;

        if (isSuccessResponse(_res)) {
          const _records = this.config.format(_res.data);
          const _lastRecord = _records[_records.length - 1];
          const _isToday = isToday(new Date(_lastRecord?.updatedAt));

          if (
            _records &&
            _records.length &&
            this._lastRecordId !== _lastRecord?.id
          ) {
            this.counts._insertions += _records.length;
            this.counts.insertions += _records.length;
            this.config.insert(_res.data);
            this._lastRecordId = _lastRecord.id;
          }

          this._continuation = _res.data.continuation;

          if (_records.length < 1000 && _isToday) {
            this.backfilled = true;
            this.status = 'upkeeping';
          }

          if (_records.length < 1000 && !_isToday) {
            this.isBusy = false;
            break;
          }
        }
      }
      resolve();
    });
  }
}
