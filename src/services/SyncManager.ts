import { uuid } from 'uuidv4';
import { ManagerConfig, Status, Workers } from '../types';
import {
  incrementDate,
  isSameMonth,
  isSuccessResponse,
  isValidDate,
} from '../utils';
import { SyncerWorker } from './SyncWorker';

export class SyncManager {
  /**
   * Flag to determine whether or not to use the backup to create workers
   * @type {Boolean}
   * @access private
   */
  private _useBackup: boolean = false;

  /**
   * Status of the SyncManager "Backifilling" | "Upkeeping"
   * @type {Status}
   * @access public
   */
  public status: Status = 'backfilling';

  /**
   * Date of the manager
   * @type {String}
   * @access public
   */
  public _date: string = '';
  /**
   * Manager backfill flag to determine if a worker has reached a cursor
   * @type {Boolean}
   * @access public
   */
  public backfilled: boolean = false;
  /**
   * Manager is busy flag
   * @type {Boolean}
   * @access public
   */
  public isBusy: boolean = false;
  /**
   * Manager watcher interval reference
   * @type {NodeJS.Timer}
   * @access public
   */
  public watcher: NodeJS.Timer | null = null;

  /**
   * Day workers
   * @type {Map<string, SyncerWorker | undefined>}
   * @access private
   */
  public workers: Map<string, SyncerWorker | undefined> = new Map();

  /**
   * Manager config
   * @type {ManagerConfig}
   * @access public
   */
  public _config: ManagerConfig;

  /**
   * Total number of requests executed
   * @type {number}
   * @access public
   */
  public requestCount: number = 0;

  /**
   * Total number of insertions executed
   * @type {number}
   * @access public
   */
  public insertCount: number = 0;

  constructor(_config: ManagerConfig) {
    const { date, workers } = _config;
    this._config = _config;
    this._date = date;

    if (workers?.length && workers.length > 0) {
      this._useBackup = true;
      console.log(`USING BACKUP`);
      process.exit(1);
    }
  }
  /**
   * # launch
   * Launches the SyncManager
   * @access public
   * @returns {void} - void
   */
  public async launch(): Promise<void> {
    this._date = this._config.date;
    const yearMonth = this._config.date.substring(0, 7);

    this.isBusy = true;

    const _res = await this._config.request({
      date: yearMonth,
      continuation: '',
    });

    if (!isSuccessResponse(_res)) {
      return await this.launch();
    }

    const _records = this._config.format(_res.data);

    this.requestCount += 1;
    this._config.insert(_res.data);
    this.insertCount += _records.length;

    if (_records.length === 1000 && _res.data.continuation) {
      const _lastRecord = _records[_records.length - 1];
      this._date = _lastRecord.updatedAt.substring(0, 10);
      await this._handleSyncing();
    }
    this._config.backup();
    this.isBusy = false;
  }
  /**
   * # _launchSyncers
   * Launch the syncers
   * @access private
   * @returns {Promise<void>} - Promise<void>
   */
  private async _handleSyncing(): Promise<void> {
    this._useBackup ? this._restoreWorkers() : this._createWorkers();
    await this._launchWorkers();
  }
  /**
   * # _restoreWorkers
   * Restores sync workers
   * @returns {void}
   * @access private
   */
  private _restoreWorkers(): void {
    this.workers = this._config.workers?.reduce((workers, worker) => {
      const id = `worker-${uuid()}`;
      return workers.set(
        id,
        new SyncerWorker({
          ...this._config,
          id,
          review: this._reviewWorker.bind(this),
          date: worker.date,
        })
      );
    }, new Map<string, SyncerWorker | undefined>()) as Workers;
    this._useBackup = false;
  }
  /**
   * # _launchWorkers
   * Initial launch method for the workers
   * @access private
   * @returns {Promise<void>} - Promise<void>
   */
  private async _launchWorkers(): Promise<void> {
    const workers = await Promise.allSettled(
      Array.from(this.workers.values()).map((worker) => {
        return worker?.sync();
      })
    );
    workers.forEach((worker) => {
      if (worker.status === 'fulfilled') {
        this._deleteWorker(worker.value as string);
      }
    });
  }

  /**
   * # _reviewWorkers
   * Reviews the status of the workers
   * @access private
   * @returns {void} - void
   */
  private _reviewWorker(worker: SyncerWorker): Boolean {
    const _reqs = worker.counts.requests;

    this.requestCount += _reqs['2xx'] += _reqs['4xx'] += _reqs['5xx'];
    this.insertCount += worker.counts.insertions;

    worker.counts.insertions = 0;
    _reqs['2xx'] = 0;
    _reqs['4xx'] = 0;
    _reqs['5xx'] = 0;

    if (worker.backfilled) {
      this.backfilled = true;
      this.status = 'upkeeping';
      return false;
    }
    this._config.backup();
    return this._assignWorker(worker);
  }
  /**
   * # _createManagers
   * Creates day workers for the sync service
   * @access private
   * @returns {void} - void
   */
  private _createWorkers(): void {
    for (let i = 0; i < this._config.workerCount; i++) {
      if (i !== 0) {
        const date = incrementDate(this._date, { days: 1 });
        if (!isSameMonth(date, this._date) || !isValidDate(date)) return;
        this._date = date;
      }
      const id = `worker-${uuid()}`;
      this.workers.set(
        id,
        new SyncerWorker({
          ...this._config,
          id,
          review: this._reviewWorker.bind(this),
          count: this._config.count,
          date: this._date,
        })
      );
    }
  }
  /**
   * # _deleteWorker
   * Deletes an instance of a worker
   * @param {String} id - Worker instance
   * @returns {void} - void
   */
  private _deleteWorker(id: string): void {
    this.workers.set(id, undefined);
    this.workers.delete(id);
  }

  /**
   * # _assignWorker
   * Assigns an instance of a worker with new work
   * @returns {void} - void
   */
  private _assignWorker(worker: SyncerWorker): Boolean {
    const _date = incrementDate(this._date, { days: 1 });
    if (isSameMonth(_date, this._date) && isValidDate(_date)) {
      this._date = incrementDate(this._date, { days: 1 });
      worker.config.date = this._date;
      return false;
    } else {
      return true;
    }
  }
}
