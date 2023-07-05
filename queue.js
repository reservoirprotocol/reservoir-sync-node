import { EventEmitter } from 'events';

class Master extends EventEmitter {
  constructor() {
    super();
  }
}



class

// Each worker will extend the event emitter class
// So that it can emit that it is done working
// The msater will listen to those workers? Will that cause a memory leak? No cause theres relaly only 10 and they are ran on a diff process