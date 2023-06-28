import { Block } from 'types';

/**
 * Class representing a Queue. It extends EventEmitter.
 * The Queue class emits events to all workers based on their group identifier.
 * @property _queue - An array of blocks, representing the queue.
 * @property controller - An instance of the Controller class.
 */
export class Queue {
  /**
   * # _queue
   * Queue of blocks.
   * @private
   */

  private _queue: Block[] = [];

  public length: number = 0;

  /**
   * # _getBlock
   * Gets the next block in the queue.
   * @returns {Block | null} - The next block in the queue or null if the queue is empty.
   * @public
   */
  public _getBlock(): Block | null {
    if (!this._queue.length) return null;

    const block: Block | undefined = this._queue.shift();
    if (block) {
      this._removeBlock(block);
      return block;
    }
    return null;
  }

  /**
   * # _removeBlock
   * Removes a block from the queue.
   * @param {Block | undefined} block - The block to be removed.
   * @private
   */
  private _removeBlock(block: Block | undefined): void {
    this._queue = this._queue.filter(({ id }) => id !== block?.id);
  }

  /**
   * # _insertBlock
   * Inserts a new block into the queue.
   * @param {Block} block - The block to be inserted.
   * @public
   */
  public _insertBlock(block: Block): void {
    this._queue.push(block);
  }
}
