import { createClient, type RedisClientType } from 'redis';
import { LoggerService } from '.';
import { Worker } from '../syncer/Worker';
import { Backup, Block, DataTypes, QueueServiceConfig } from '../types';

/**
 * Queue class for managing a Redis-based queue.
 * Allows insertion and retrieval of blocks in a FIFO manner.
 */
class _Queue {
  /**
   * Config object for the queue service
   * @private
   */
  private _config: QueueServiceConfig = {
    useBackup: false,
  };
  /**
   * SyncNode backup
   */
  private _backups: {
    [key: string]: Backup;
  } | null = null;
  /**
   * Redis client instance
   * @private
   */
  private _client: RedisClientType = createClient({
    url: process.env.REDIS_URL as string,
  });

  /**
   * Constructor initializes a new redis client and sets up an error listener.
   */
  constructor() {
    this._client.on('error', (err) => LoggerService.error(err));
  }

  /**
   * Retrieves all blocks of the given datatype from the queue.
   *
   * @param datatype - The type of the data to be retrieved
   * @returns A promise that resolves to an array of blocks
   * @public
   */
  public async getAllBlocks(datatype: DataTypes): Promise<Block[]> {
    try {
      await this._client.exe
      const blocks = await this._client.lRange(`${datatype}-queue`, 0, -1);
      return blocks
        ? (blocks.map((block) => JSON.parse(block)) as Block[])
        : [];
    } catch (e: unknown) {
      return [];
    }
  }

  /**
   * Backs up the current state of the node.
   *
   * @param datatype - The type of the data to be backed up
   * @param workers - The array of worker instances
   * @returns A promise that resolves when the backup is completed
   * @public
   */
  public async backup(datatype: DataTypes, workers: Worker[]): Promise<void> {
    try {
      await this._client.hSet(
        `backups`,
        `${datatype}-backup`,
        JSON.stringify({
          workers: workers.map(({ data }) => {
            return { block: data?.block, continuation: data?.continuation };
          }),
        })
      );
    } catch (e: unknown) {
      return await this.backup(datatype, workers);
    }
  }
  public async getQueueLength(datatype: DataTypes): Promise<number> {
    try {
      return await this._client.lLen(`${datatype}-queue`);
    } catch (e: unknown) {
      return 0;
    }
  }
  /**
   * Gets the backup for a specific datatype
   * @param datatype Datatype for backup
   * @returns Backup of the controller or null if not found
   */
  public getBackup(datatype: string): Backup | null {
    if (!this._config.useBackup) return null;
    return this._backups ? this._backups[`${datatype}-backup`] : null;
  }
  /**
   * Loads all the stored backups in the Redis database and stores them in `_backups`.
   *
   * @returns A promise that resolves when backups are loaded or rejects if any error occurred
   * @public
   */
  public async loadBackup(): Promise<void> {
    try {
      this._backups = Object.fromEntries(
        Object.entries(await this._client.hGetAll('backups')).map(
          ([key, value]) => [key, JSON.parse(value) as Backup]
        )
      );
    } catch (e: unknown) {
      return;
    }
  }

  /**
   * Inserts a block into the queue.
   *
   * @param block - The block to be inserted
   * @param datatype - The datatype of the block
   * @returns A promise that resolves when the block is inserted
   * @public
   */
  public async insertBlock(block: Block, datatype: DataTypes): Promise<void> {
    try {
      await this._client.lPush(`${datatype}-queue`, JSON.stringify(block));
    } catch (e: unknown) {
      return await this.insertBlock(block, datatype);
    }
  }

  /**
   * Retrieves a block from the queue.
   *
   * @param datatype - The datatype of the block to be retrieved
   * @returns A promise that resolves to the retrieved block or null
   * @public
   */
  public async getBlock(datatype: DataTypes): Promise<Block | null> {
    try {
      const block = await this._client.rPop(`${datatype}-queue`);

      return block ? (JSON.parse(block) as Block) : null;
    } catch (e: unknown) {
      return await this.getBlock(datatype);
    }
  }
  public construct(config: QueueServiceConfig): void {
    this._config = config;
  }
  /**
   * Launches the queue by connecting the Redis client.
   *
   * @returns A promise that resolves when the connection is established
   * @public
   */
  public async launch(): Promise<void> {
    await this._client.connect();
    LoggerService.info(`Queue Service Launched`);
  }
}

/**
 * Exported instance of the queue service.
 * @public
 */
export const QueueService = new _Queue();
