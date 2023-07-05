import { createClient, type RedisClientType } from 'redis';
import { Block, DataTypes } from 'types';
import { LoggerService } from '.';

/**
 * Queue class for managing a Redis-based queue.
 * Allows insertion and retrieval of blocks in a FIFO manner.
 */
class _Queue {
  /**
   * Redis client instance
   * @private
   */
  private _client: RedisClientType;

  constructor() {
    this._client = createClient({
      url: process.env.REDIS_URL,
    });

    this._client.on('error', (err) => LoggerService.error(err));
  }

  /**
   * Inserts a block into the queue.
   * @param block - The block to be inserted
   * @param datatype - The datatype of the block
   * @returns Promise<void>
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
   * @param datatype - The datatype of the block to be retrieved
   * @returns A Promise that resolves to the retrieved block or null
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

  /**
   * Launches the queue by connecting the Redis client.
   * @returns Promise<void>
   * @public
   */
  public async launch(): Promise<void> {
    await this._client.connect();
  }
}

export const Queue = new _Queue();
