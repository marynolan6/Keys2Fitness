// AsyncStorage in the app, in-memory storage in tests.
export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};

export type EnumerableKeyValueStorage = KeyValueStorage & {
  removeItem(key: string): Promise<unknown>;
  getAllKeys(): Promise<readonly string[]>;
};

// Reads, migrations, and read-modify-writes on the same store must stay in order.
export function createStorageQueue() {
  let pending: Promise<unknown> = Promise.resolve();
  return {
    run<T>(operation: () => Promise<T>): Promise<T> {
      const result = pending.then(operation);
      pending = result.catch(() => undefined);
      return result;
    },
  };
}
