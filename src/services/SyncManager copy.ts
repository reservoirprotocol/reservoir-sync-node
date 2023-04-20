import { ManagerConfig, Status, Workers } from '@/types';
import { isSuccessResponse } from '@/utils';
import { uuid } from 'uuidv4';
import { SyncWorker } from './SyncWorker copy';

export class SyncManager {
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
  public async launch(): Promise<void> {
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
     * Update the backup and busy flag
     */
    this.config.backup();
    this.isBusy = false;
  }
  /**
   * # _launchSyncers
   * Launch the syncers
   * @access private
   * @returns {void}
   */
  private async _handleSyncing(): Promise<void> {
    this._useBackup ? this._restoreWorkers() : this._createWorkers();
    // await this._launchWorkers();
  }
  /**
   * # _restoreWorkers
   * Restores sync workers
   * @returns {void}
   * @access private
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
   * @returns {void} - void
   */
  private _createWorkers(): void {}
  /**
   * # _reviewWorkers
   * Reviews the status of the workers
   * @access private
   * @returns {void} - void
   */
  private _reviewWorker(worker: SyncWorker): Boolean {
    return false;
  }
}
