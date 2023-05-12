import { createClient, RedisClientType } from 'redis';
import { Backup, SyncNodeConfig } from '../types';
import { LoggerService } from './LoggerService';

/**
 * BackupService class is responsible for handling caching-related operations.
 */
class _BackupService {
  /**
   * Flag to determine the connection status to the redis client
   * @access private
   * @type {Boolean}
   */
  private _connected: boolean;
  /**
   * Redis client
   * @access private
   * @type {RedisClientType}
   */
  private _client: RedisClientType | null;

  constructor() {
    this._client = null;
    this._connected = false;
  }

  /**
   * # set
   * Sets the class variables of the BackupService
   * @param {SyncNodeConfig['backup']} config - SyncNode backup config
   * @access public
   * @returns {void} - void
   */
  public set(config: SyncNodeConfig['backup']): void {
    this._client = createClient({
      url: config?.redisUrl,
    });
  }
  /**
   * # launch
   * Launches the BackupService
   * @access public
   * @returns {void} void
   */
  public async launch(): Promise<void> {
    if (this._client) {
      try {
        await this._client.connect();
        this._connected = true;
      } catch (err: unknown) {
        LoggerService.error(err);
        this._connected = false;
      }
    }
  }

  /**
   * # backup
   * Creates or updates a backup of the SyncNode
   * @param {Backup} data - The data to be created/updated
   * @access public
   * @returns {void} void
   */
  public async backup(data: Backup): Promise<void> {
    if (!this._connected) return;
    try {
      await this._client?.hSet(data.type, {
        backup: JSON.stringify(data.data),
      });
    } catch (err: unknown) {
      LoggerService.error(err);
    }
  }
  /**
   * # load
   * Loads a SyncNode backup
   * @param {String} type - Syncer type
   * @access public
   * @returns {Backup | null} SyncNode backup or null if there isn't a backup
   */
  public async load(type: string): Promise<Backup | null> {
    if (!this._connected) return null;
    try {
      const data = await this._client?.hGet(type, 'backup');
      if (!data) return null;
      const backup = JSON.parse(data) as Backup['data'];
      return {
        type,
        data: {
          date: backup.date,
          managers: backup.managers,
        },
      };
    } catch (err: unknown) {
      LoggerService.error(err);
      return null;
    }
  }
  /**
   * # delete
   * Flushes all of the stored SyncNode states
   * @access public
   * @returns {void}
   */
  public async flush(): Promise<void> {
    if (!this._connected) return;
    try {
      await this._client?.flushDb();
    } catch (err: unknown) {
      LoggerService.error(err);
    }
  }
}

export const BackupService = new _BackupService();
