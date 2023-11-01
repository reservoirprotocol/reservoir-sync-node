import { createClient, RedisClientType } from "redis";
import { Worker } from "../syncer/Worker";
import { Backup, Block, DataTypes, QueueServiceConfig } from "../types";
import { LoggerService } from "./LoggerService";

/**
 * Queue class for managing a Redis-based queue.
 * Allows insertion and retrieval of blocks in a FIFO manner.
 * @class
 */
class _Queue {
  /**
   * Config object for the queue service
   * @type {QueueServiceConfig}
   * @private
   */
  private _config: QueueServiceConfig = {
    useBackup: false,
  };

  /**
   * A dictionary holding SyncNode backups
   * @type {Object.<string, Backup>}
   * @private
   */
  private _backups: {
    [key: string]: Backup;
  } | null = null;

  /**
   * Contract filters for each dataset
   */
  public contracts: Record<DataTypes, string[]> = {
    sales: [],
    asks: [],
    bids: [],
    transfers: [],
  };

  /**
   * Redis client instance
   * @type {RedisClientType}
   * @private
   */
  private _client: RedisClientType = createClient({
    url: process.env.REDIS_URL as string,
  });

  /**
   * _Queue class constructor
   * Initializes a new redis client and sets up an error listener.
   * @constructor
   */
  constructor() {
    this._client.on("error", (err) => LoggerService.error(err));
  }

  /**
   * Backs up the current state of the node.
   * @param {DataTypes} datatype - The type of the data to be backed up.
   * @param {Worker[]} workers - The array of worker instances.
   * @returns {Promise<void>} - A promise that resolves when the backup is completed.
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

  /**
   * Gets the length of the queue.
   * @param {DataTypes} datatype - The datatype of the queue.
   * @returns {Promise<number>} - A promise that resolves with the length of the queue.
   */
  public async getQueueLength(
    datatype: DataTypes,
    priority: 1 | 2 | 3
  ): Promise<number> {
    try {
      return await this._client.lLen(`${datatype}-queue-priority:${priority}`);
    } catch (e: unknown) {
      LoggerService.error(e);
      return 0;
    }
  }

  /**
   * Writes and stores contracts in redis
   *
   * @param contracts - Contracts to write
   * @returns {Promise<void>} - A promise that resolves when the contracts have been written.
   */
  public async addContracts(
    contracts: string[],
    type: DataTypes
  ): Promise<void> {
    try {
      const currentContracts = await this.getContracts(type);

      const combinedContractsSet = new Set([...currentContracts, ...contracts]);
      const combinedContracts = [...combinedContractsSet];

      await this._client.sAdd(`${type}:contracts`, combinedContracts);

      this.contracts[type] = combinedContracts;
    } catch (e: unknown) {
      LoggerService.error(e);
      return this.addContracts(contracts, type);
    }
  }

  /**
   * Returns the contracts that are stored in redis
   *
   * @returns {Promise<void>} - A promise that resolves with an array of contracts
   */
  public async getContracts(type: DataTypes): Promise<string[]> {
    try {
      const contracts: string[] = await this._client.sMembers(
        `${type}:contracts`
      );
      return contracts;
    } catch (e: unknown) {
      LoggerService.error(e);
      return [];
    }
  }

  /**
   * Clears all backups.
   * @returns {Promise<void>} - A promise that resolves when the backups are cleared.
   */
  public async clearBackup(): Promise<void> {
    LoggerService.info(`Clearing Backup`);
    const keys: string[] = ["transfers", "asks", "bids", "sales"];

    try {
      await Promise.allSettled(
        keys.map(async (key) => {
          this._client.del(`${key}-queue-priority-1`);
          this._client.del(`${key}-queue-priority-2`);
          this._client.del(`${key}-queue-priority-3`);
        })
      );
    } catch (e: unknown) {
      LoggerService.error(`Error deleting queues`);
      LoggerService.error(e);
      process.exit(0);
    }

    try {
      this._client.del("backups");
    } catch (e: unknown) {
      LoggerService.error(`Error deleting backups`);
      LoggerService.error(e);
      process.exit(0);
    }
  }

  /**
   * Loads the contracts for every dataset
   *
   * @returns {Promise<void>} - A promise that resolves when the contracts are loaded
   */
  public async loadContracts(): Promise<void> {
    for await (const key of [
      "sales",
      "asks",
      "bids",
      "transfers",
    ] as DataTypes[]) {
      this.contracts[key] = await this.getContracts(key);
    }
    LoggerService.info(`Loaded Contracts`);
  }

  /**
   * Retrieves the backup for a specific datatype.
   * @param {string} datatype - The datatype for which to retrieve the backup.
   * @returns {Backup | null} - The backup, or null if no backup was found.
   */
  public getBackup(datatype: string): Backup | null {
    if (!this._config.useBackup) return null;
    return this._backups ? this._backups[`${datatype}-backup`] : null;
  }

  /**
   * Loads all the stored backups in the Redis database.
   * @returns {Promise<void>} - A promise that resolves when the backups are loaded.
   */
  public async loadBackup(): Promise<void> {
    try {
      LoggerService.info(`Loading Backup`);
      this._backups = Object.fromEntries(
        Object.entries(await this._client.hGetAll("backups")).map(
          ([key, value]) => [key, JSON.parse(value) as Backup]
        )
      );
    } catch (e: unknown) {
      LoggerService.error(e);
      return;
    }
  }

  /**
   * Inserts a block into the queue.
   * @param {Block} block - The block to be inserted.
   * @param {DataTypes} datatype - The datatype of the block.
   * @returns {Promise<void>} - A promise that resolves when the block is inserted.
   */
  public async insertBlock(block: Block, datatype: DataTypes): Promise<void> {
    try {
      const { priority } = block;
      const queueName = `${datatype}-queue-priority:${priority}`;
      await this._client.lPush(queueName, JSON.stringify(block));
    } catch (e: unknown) {
      LoggerService.error(e);
      return await this.insertBlock(block, datatype);
    }
  }

  /**
   * Retrieves a block from the queue.
   * @param {DataTypes} datatype - The datatype of the block to be retrieved.
   * @returns {Promise<Block | null>} - A promise that resolves to the retrieved block, or null.
   */
  public async getBlock(datatype: DataTypes): Promise<Block | null> {
    try {
      for (const priority of [1, 2, 3]) {
        const queueName = `${datatype}-queue-priority:${priority}`;
        const block = await this._client.rPop(queueName);
        if (block) return JSON.parse(block) as Block;
      }
      return null;
    } catch (e: unknown) {
      return await this.getBlock(datatype);
    }
  }

  /**
   * Configures the _Queue with the provided config.
   * @param {QueueServiceConfig} config - The config to apply.
   */
  public construct(config: QueueServiceConfig): void {
    this._config = config;
  }

  /**
   * Establishes a connection to the Redis database.
   * @returns {Promise<void>} - A promise that resolves when the connection is established.
   */
  public async launch(): Promise<void> {
    await this._client.connect();
    LoggerService.info(`Queue Service Launched`);
  }
}

/**
 * Exported instance of the queue service.
 * @type {_Queue}
 */
export const QueueService = new _Queue();
