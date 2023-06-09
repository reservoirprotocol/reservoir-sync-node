/* eslint-disable no-constant-condition */
/* eslint-disable no-async-promise-executor */
import { Counts, KnownPropertiesType, Status, WorkerConfig } from '../types';
import { delay, isSuccessResponse, isTodayUTC } from '../utils';

export class SyncWorker {
  /**
   * # id
   * A unique identifier for the worker
   * @access public
   * @type {String}
   */
  public id: string;

  /**
   * # isBackfilled
   * A flag that indicates the backfill staus of the worker
   * @access public
   * @type {Boolean}
   */
  public isBackfilled: boolean;

  /**
   * # isBusy
   * A flag that indicates the busy status of the worker
   * @acccess public
   * @type {Boolean}
   */
  public isBusy: boolean;

  /**
   * # continuation
   * The continuation token to use for data pagination
   * @access public
   * @type {String}
   */
  public continuation: string;

  /**
   * # counts
   * Request & Insertion counts that the worker has processed
   * @access public
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
   * # status
   * A status string that indicates the sync status of the worker
   * @access public
   * @type {Status}
   */
  public status: Status;

  /**
   *  # config
   * The configuration for fhe worker
   * @access public
   * @type {WorkerConfig}
   */
  public config: WorkerConfig;

  /**
   * # date
   * The date that the worker is on
   * @access public
   * @type {String}
   */
  public date: string;

  /**
   * # _recentId
   * The recent identifier of the last record in the previous results
   * @access private
   * @type {String}
   */
  private _recentId: string;

  constructor(config: WorkerConfig) {
    /**
     * Set public variables
     */
    this.id = config.id;
    this.isBusy = false;
    this.config = config;
    this.date = config.date;
    this.isBackfilled = false;
    this.status = 'backfilling';
    this.continuation = config.continuation;

    /**
     * Set private variables
     */
    this._recentId = '';
  }
  public sync(): Promise<string> {
    this.isBusy = true;

    return new Promise<string>(async (resolve): Promise<void> => {
      while (true) {
        /**
         * Fetch the data using the pagination token and the date
         */
        const res = await this.config.request({
          continuation: this.continuation,
          date: this.date,
          isBackfilled: this.isBackfilled,
        });

        /**
         * Increment the private request counts
         */
        this.counts._requests[
          `${res.status.toString().split('')[0]}xx` as keyof Counts['requests']
        ]++;

        /**
         * Increment the public request counts
         */
        this.counts.requests[
          `${res.status.toString().split('')[0]}xx` as keyof Counts['requests']
        ]++;

        /**
         * Use a typeguard to ensure that the resposne is 2xx
         */
        if (isSuccessResponse(res)) {
          /**
           * Format the data into an array
           */ // this.type
          const data = this.config.format(res.data); // this.data.sales; this.date.orders

          /**
           * Extract the last set from the data
           */
          const lastSet = data[data.length - 1];

          /**
           * Determine whether the last record matches todays date
           */
          const isToday = isTodayUTC(lastSet?.updatedAt);

          /**
           * Handle all the insertion related calls
           */
          this._handleInsertions(res.data);

          /**
           * Set the current pagination token to the one we just recieved
           */
          this.continuation = res.data.continuation || this.continuation;

          /**
           * If the dataset is less than 1000 and it is today then we have reached our backfilling point
           */
          if (data.length < 1000 && isToday) {
            this.isBackfilled = true;
            this.status = 'upkeeping';
          }

          /**
           * If the dataset is less than 1000 and it isn't today then we might still have more data
           */
          if (data.length < 1000 && !isToday) {
            /**
             * We callback to the review method to either break or recieve new work
             */
            if (!this.config.review(this, isToday)) break;
          }
          this.config.backup();
          if (this.isBackfilled && !res.data.continuation) {
            await delay(this.config.upkeepDelay);
          }
        }
      }

      resolve(this.id);
    });
  }
  /**
   * # _handleInsertions
   * Handles insertion related calls
   * @param {IndexSignatureType} data - Request resposne data
   * @returns {void}
   */
  private _handleInsertions(data: KnownPropertiesType): void {
    const parsed = this.config.format(data);
    if (parsed.length && this._recentId !== parsed[parsed.length - 1].id) {
      this.counts._insertions += parsed.length;
      this.counts.insertions += parsed.length;
      this.config.insert(data);
      this._recentId = parsed[parsed.length - 1].id;
    }
  }
}
