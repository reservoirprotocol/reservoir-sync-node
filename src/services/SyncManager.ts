import { uuid } from 'uuidv4';
import { ManagerConfig, Status, Workers } from '../types';
import {
  incrementDate,
  isSameMonth,
  isSuccessResponse,
  isValidDate,
} from '../utils';
import { SyncWorker } from './SyncWorker';

export class SyncManager {
  /**
   * # id
   * SyncManager unique identifier
   * @access private
   * @type {String}
   */
  public id: string;
  /**
   * # _useBackup
   * Flag to determine whether or not to use the backup to create workers
   * @access private
   * @type {Boolean}
   */
  private _useBackup: boolean;

  /**
   * # status
   * A status string that indicates the sync status of the manager
   * @type {Status}
   * @access public
   */
  public status: Status;

  /**
   * # date
   * Date of the manager
   * @access public
   * @type {String}
   */
  public date: string;

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
   * @access public
   * @type {Boolean}
   */
  public isBusy: boolean = false;

  /**
   * # workers
   * Sync Workers
   * @access public
   * @type {Map<string, SyncerWorker | undefined>}
   */
  public workers: Map<string, SyncWorker> = new Map();

  /**
   * # config
   * Manager configuration
   * @access public
   * @type {ManagerConfig}
   */
  public config: ManagerConfig;

  /**
   * # requestCount
   * Total number of requests executed by the manager
   * @acccess public
   * @type {number}
   */
  public requestCount: number;

  /**
   * # insertCount
   * Total number of insertions executed by the manager
   * @access public
   * @type {number}
   */
  public insertCount: number;

  constructor(config: ManagerConfig) {
    /**
     * Set public variables
     */
    this.id = config.id;
    this.config = config;
    this.insertCount = 0;
    this.requestCount = 0;
    this.date = config.date;
    this.workers = new Map();
    this.isBackfilled = false;
    this.status = 'backfilling';

    /**
     * Set private variables
     */
    this._useBackup = config.workers ? true : false;
  }
  /**
   * # launch
   * Launches the SyncManager instance
   * @access public
   * @returns void
   */
  public async launch(): Promise<string> {
    return new Promise(async (resolve) => {
      while (true) {
        /**
         * Set the data parameters for the initial request
         */
        this.date = this.config.date;
        const yearMonth = this.config.date.substring(0, 7);

        /**
         * Set the isBusy flag to true to indicate
         * that this manager is working
         */
        this.isBusy = true;

        /**
         * Send the intial request to get the start day of the month
         * If we are able to get all the data back in a single request
         * then we can skip the month
         */
        const res = await this.config.request({
          date: yearMonth,
          continuation: '',
        });

        /**
         * This intial request has to succeed or
         * else we don't know where to start
         */
        if (!isSuccessResponse(res)) {
          return await this.launch();
        }

        /**
         * Format the data into a schema array
         */
        const data = this.config.format(res.data);

        /**
         * Increment the counts and insert the data
         */
        this.requestCount++;
        this.config.insert(res.data);
        this.insertCount += data.length;

        /**
         * If the data length is 1000 and we have a cursor then we
         * know that there is more data to paginate through
         */
        if (data.length === 1000 && res.data.continuation) {
          const lastSet = data[data.length - 1]; // Get the last set in the dataset
          this.date = lastSet.updatedAt.substring(0, 10); // Parse the last date and set it to the working date
          await this._handleSyncing(); // Handle the syncing
        }

        /**
         * Update the backup
         */
        if (!this.config.review(this)) break;
      }
      resolve(this.id);
    });
  }
  /**
   * # _launchSyncers
   * Launch the syncers
   * @access private
   * @returns {void}
   */
  private async _handleSyncing(): Promise<void> {
    this._useBackup ? this._restoreWorkers() : this._createWorkers();
    await this._launchWorkers();
  }
  /**
   * # _restoreWorkers
   * Restores sync workers
   * @access private
   * @returns void
   */
  private _restoreWorkers(): void {
    this.workers = this.config.workers?.reduce((workers, worker) => {
      const id = `worker-${uuid()}`;
      return workers.set(
        id,
        new SyncWorker({
          ...this.config,
          id,
          date: worker.date,
          review: this._reviewWorker.bind(this),
          continuation: worker.continuation,
        })
      );
    }, new Map<string, SyncWorker>()) as Workers;
    this._useBackup = false;
  }
  /**
   * # _createManagers
   * Creates day workers for the sync service
   * @access private
   * @returns void
   */
  private _createWorkers(): void {
    for (let i = 0; i < Number(this.config.workerCount || 1); i++) {
      if (i !== 0) {
        const date = incrementDate(this.date, { days: 1 });
        if (!isSameMonth(date, this.date) || !isValidDate(date)) return;
        this.date = date;
      }
      const id = `worker-${uuid()}`;
      this.workers.set(
        id,
        new SyncWorker({
          ...this.config,
          id,
          date: this.date,
          review: this._reviewWorker.bind(this),
          continuation: '',
        })
      );
    }
  }
  /**
   * # _reviewWorkers
   * Reviews the status of the workers
   * @param {SyncWorker} worker - worker instance
   * @access private
   * @returns {void} - void
   */
  private _reviewWorker(worker: SyncWorker): Boolean {
    const _reqs = worker.counts.requests;

    this.requestCount += _reqs['2xx'] += _reqs['4xx'] += _reqs['5xx'];
    this.insertCount += worker.counts.insertions;

    worker.counts.insertions = 0;
    _reqs['2xx'] = 0;
    _reqs['4xx'] = 0;
    _reqs['5xx'] = 0;

    if (worker.isBackfilled) {
      this.isBackfilled = true;
      this.status = 'upkeeping';
      return true;
    }
    this.config.backup();
    return this._continueWork(worker);
  }
  /**
   * # _continueWork
   * Determines if a worker should continue working or not based on the date
   * @access private
   * @returns void
   */
  private _continueWork(worker: SyncWorker): Boolean {
    const _date = incrementDate(this.date, { days: 1 });
    if (isSameMonth(_date, this.date) && isValidDate(_date)) {
      this.date = incrementDate(this.date, { days: 1 });
      worker.date = this.date;
      return true;
    } else {
      this._deleteWorker(worker.id);
      return false;
    }
  }
  /**
   * # _launchWorkers
   * Initial launch method for the workers
   * @access private
   * @returns {Promise<void>} - Promise<void>
   */
  private async _launchWorkers(): Promise<void> {
    const promises = await Promise.allSettled(
      Array.from(this.workers.values()).map((worker) => {
        return worker?.sync();
      })
    );
    promises.forEach((promise: any) => {
      this._deleteWorker(promise.value);
    });
  }
  /**
   * # _deleteWorker
   * Deletes an instance of a worker
   * @param {String} id - Worker instance
   * @returns {void} - void
   */
  private _deleteWorker(id: string): void {
    this.workers.delete(id);
  }
}
