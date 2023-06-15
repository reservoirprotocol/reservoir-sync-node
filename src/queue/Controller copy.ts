    import { EventEmitter } from 'stream';
    import { Chains, DataRoots, DataTypes } from '../types';
    import { Worker } from "./Worker";



    // Controller is the handler for all of the workers
    // Workers extend event emitters



    interface WorkerConfig {
      uuid: string;
      apiKey: string;
    }
    interface Mapping {
      type: DataTypes;
      root: DataRoots;
    }
    interface Block {
      id: string;
      startTimestamp: number;
      endTimestamp: number;
      chain: Chains;
      mapping: Mapping;
    }
    interface Parameters {
      startTimestamp: number;
      endTimestamp: number;
      continuation: string | null;
    }
    interface Timestamp {
      startTimestamp: string;
      endTimestamp: string;
    }
    interface ControllerConfig {

    };
    interface WorkerEvent {
      type: 'worker.started' | 'worker.done' | 'worker.split' | 'worker.release';
      block: Block;
      split?: Block[];
    }

    export class Controller extends EventEmitter {
      /**
       * # _pool
       * Worker pool for processing blocks
       * @access private
       */
      private _pool: Worker[];

      /**
       * # _queue
       * Queue for block events
       * @access private
       */
      private _queue: Block[];

      /**
       * The type of controller - e.g. sales, bids, transfers
       * @access private
       */
      private _controllerType;


      constructor(config: ControllerConfig) {
        super();
      };

      private async _callbackWorker(worker: Worker, event: WorkerEvent) {
        const handleEvent = async () => {
          switch (event.type) {
            case 'worker.split': {
              // handle split event here
              return;
            }
            case 'worker.release': {
              this._queue = this._queue.filter((block) => block.id !== event.block.id);
              if (this._queue.length > 0) {
                const nextBlock = this._queue[0];
                await worker._process(nextBlock);
              }
              return;
            }
          }
        };

        // If worker is busy, wait until it's done then handle the event
        if (worker._processing) {
          worker._config.listener.once('worker.release', () => handleEvent());
        } else {
          await handleEvent();
        }
      }

      private _createRange() {

      };
      private _createWorkers() {

      };
    };




    /**
     * SyncNode launched
     * Sync sales
     * Create a controller for sales
     * Controller creates workers
     * Controller 
     */