import { uuid } from 'uuidv4';
import { ManagerConfig, Status } from '../types';
import {
  incrementDate,
  isSameMonth,
  isSuccessResponse,
  isValidDate,
} from '../utils';
import { SyncerWorker } from './SyncWorker';

export class SyncManager {
  /**
   * Status of the SyncManager "Backifilling" | "Upkeeping"
   * @type {Status}
   * @access public
   */
  public status: Status = 'backfilling';

  /**
   * Date of the manager
   * @type {String}
   * @access private
   */
  private _date: string = '';
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
    this._config = _config;
    this._date = _config.date;
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
      return this.launch();
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
    this.isBusy = false;
  }
  /**
   * # _launchSyncers
   * Launch the syncers
   * @access private
   * @returns {Promise<void>} - Promise<void>
   */
  private async _handleSyncing(): Promise<void> {
    this._createWorkers();
    this.watchWorkers();
    await this._launchWorkers();
  }
  /**
   * # _launchWorkers
   * Initial launch method for the workers
   * @access private
   * @returns {Promise<void>} - Promise<void>
   */
  private async _launchWorkers(): Promise<void> {
    await Promise.all(
      Array.from(this.workers.values()).map((worker) => worker?.launch())
    );
  }

  /**
   * # _watchWorkers
   * Watches the day workers
   * @access public
   * @returns {void} - void
   */
  public watchWorkers(): void {
    this.watcher = setInterval(this._reviewWorkers.bind(this), 1000);
  }
  /**
   * # _reviewWorkers
   * Reviews the status of the workers
   * @access private
   * @returns {void} - void
   */
  private _reviewWorkers(): void {
    this.workers.forEach((worker, id): void => {
      if (!worker) return;

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
        return;
      }

      if (!worker?.isBusy && this.backfilled) {
        this._deleteWorker(id);
      } else if (!worker?.isBusy) {
        this._assignWorker(worker);
      }
    });
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

      this.workers.set(
        `worker-${uuid()}`,
        new SyncerWorker({
          ...this._config,
          count: this._config.count,
          date: this._date,
        })
      );
    }
  }
  /**
   *
   * Mark for deletion?
   *
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
  private _assignWorker(worker: SyncerWorker): void {
    const _date = incrementDate(this._date, { days: 1 });
    if (isSameMonth(_date, this._date) && isValidDate(_date)) {
      this._date = incrementDate(this._date, { days: 1 });
      worker.config.date = this._date;
      worker.launch();
    }
  }
}
