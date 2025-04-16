import { promisify } from 'util';

class AsyncLock {
  private locks: Map<string, Promise<void>>;

  constructor() {
    this.locks = new Map();
  }

  async acquire(key: string): Promise<() => void> {
    // Wait for any existing lock to be released
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let release: () => void = () => {};
    
    // Create a new lock
    const lock = new Promise<void>((resolve) => {
      release = () => {
        this.locks.delete(key);
        resolve();
      };
    });

    this.locks.set(key, lock);
    return release;
  }
}

export default AsyncLock; 