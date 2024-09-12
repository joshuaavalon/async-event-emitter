export type AsyncEventMap<T> = Record<keyof T, unknown[]>;
export type Listener<K extends keyof T, T extends AsyncEventMap<T>> = (...args: T[K]) => Promise<void> | void;

interface ListenerOptions {
  once: boolean;
}

interface ListenerEntry<K extends keyof T, T extends AsyncEventMap<T>> {
  listener: Listener<K, T>;
  options: ListenerOptions;
}

export class AsyncEventEmitter<T extends AsyncEventMap<T>> {
  private readonly listeners: { [K in keyof T]?: ListenerEntry<K, T>[] };

  public constructor() {
    this.listeners = {};
  }

  public on<K extends keyof T>(eventName: K, listener: Listener<K, T>): this {
    return this.addInternalListener(eventName, listener, { once: false });
  }

  public once<K extends keyof T>(eventName: K, listener: Listener<K, T>): this {
    return this.addInternalListener(eventName, listener, { once: true });
  }

  private addInternalListener<K extends keyof T>(eventName: K, listener: Listener<K, T>, options: ListenerOptions): this {
    const listeners = this.listeners[eventName] ?? [];
    listeners.push({ listener, options });
    this.listeners[eventName] = listeners;
    return this;
  }


  public off<K extends keyof T>(eventName: K, listener: Listener<K, T>): this {
    const listeners = this.listeners[eventName];
    if (!listeners) {
      return this;
    }
    const index = listeners.findLastIndex(entry => entry.listener === listener);
    if (index < 0) {
      return this;
    }
    listeners.splice(index, 1);
    this.listeners[eventName] = listeners;
    return this;
  }

  public async emit<K extends keyof T>(eventName: K, ...args: T[K]): Promise<boolean> {
    const listeners = this.listeners[eventName];
    if (!listeners || listeners.length <= 0) {
      return false;
    }
    for (const entry of listeners) {
      await entry.listener(...args);
    }
    this.listeners[eventName] = listeners.filter(entry => !entry.options.once);
    return true;
  }

  public async emitParallel<K extends keyof T>(eventName: K, ...args: T[K]): Promise<boolean> {
    const listeners = this.listeners[eventName];
    if (!listeners || listeners.length <= 0) {
      return false;
    }
    await Promise.all(listeners.map(entry => entry.listener(...args)));
    this.listeners[eventName] = listeners.filter(entry => !entry.options.once);
    return true;
  }

  public addListener<K extends keyof T>(eventName: K, listener: Listener<K, T>): this {
    return this.on(eventName, listener);
  }

  public removeListener<K extends keyof T>(eventName: K, listener: Listener<K, T>): this {
    return this.off(eventName, listener);
  }
}
