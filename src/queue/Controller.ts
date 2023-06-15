import EventEmitter from "events";
import { Block } from "types";
import { Worker } from "./Worker";


interface WorkerEvent {
  id: string;
  type: 'worker.started' | 'worker.done' | 'worker.split' | 'worker.release';
  block: Block;
  split?: Block[];
}

class Controller extends EventEmitter {
  /**
 * # _pool
 * Worker pool for processing blocks
 * @access private
 */
  private _pool: Worker[] = [];

  /**
   * # _queue
   * Queue for block events
   * @access private
   */
  private _queue: Block[] = [];

  constructor() {
    super();

    this._createWorkers();
    this.setMaxListeners(Infinity);
  }
  /**
   * 
   */
  private _initialSplit() {

  };



  private _createWorkers() {

  };


  /**
   * Listening method for our workers
   * @access private
   * @returns void
   */
  private _listen(): void {

    /**
     * This is an event that is called when the queue gets new items
     */

    // Change to a mtehod?
    this.on('queue.update', () => {
      const worker = this._pool.find(({ processing }: Worker) => !processing) as Worker;
      const block = this._queue.shift();

      if (block) {
        worker.processing = true;
        worker._process(block);
      };
    });


    this._pool.forEach(worker => {
      worker.on('worker.event', (event: WorkerEvent) => {

        switch (event.type) {
          case 'worker.started':
            // Worker is telling us they started working on a block
            return
          case 'worker.split':
            // Worker is requesting we split their blocks

            //
            return;
          case 'worker.release':
            // Worker is requesting to be released from its block
            return;
          case 'worker.done':
            // Worker is telling us he is done with his block 
            return;
        }

      })
    })
  }

  private _workerStarted(event: WorkerEvent): void {
    // Logging purposes
  };

  private _workerSplit(event: WorkerEvent): void {
    // In here we split the block that the worker is currently on
    // We also request work
    this.emit('queue.request')
  };

  private _workerDone(event: WorkerEvent): void {

  };

  private _workerRelease(event: WorkerEvent): void {
    // In here we set all the worker variables back to their defaults 
    // We also emit block.request because here we know that we now have a free worker
    this.emit('worker.request')
  };
};



