import EventEmitter from 'events';

// This will emit events to all of the workers based on their group identifier
class Queue extends EventEmitter {
  constructor() {}
}
