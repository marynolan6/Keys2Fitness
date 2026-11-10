// Infrastructure-only port, implemented by AsyncStorage in the composition roots.
export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
};

export type SessionKeyValueStorage = KeyValueStorage & {
  removeItem(key: string): Promise<unknown>;
  getAllKeys(): Promise<readonly string[]>;
};

// Serialize reads as well as writes: a read-time migration must not overwrite a
// checkpoint saved while the old record was being fetched.
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
