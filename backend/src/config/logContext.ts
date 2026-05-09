import { AsyncLocalStorage } from "async_hooks";

type Store = Record<string, unknown>;

export const asyncLocalStorage = new AsyncLocalStorage<Store>();

export const getLogContext = (): Store | undefined => asyncLocalStorage.getStore();

export const setLogContext = (values: Store) => {
  const store = asyncLocalStorage.getStore() || {};
  Object.assign(store, values);
};
