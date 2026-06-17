import { Platform } from 'react-native';

let AsyncStorage: any = null;
let isAsyncStorageAvailable = true;
const memoryStorage = new Map<string, string>();

if (Platform.OS !== 'web') {
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    console.warn('AsyncStorage package could not be loaded:', e);
    isAsyncStorageAvailable = false;
  }
} else {
  isAsyncStorageAvailable = false;
}

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return memoryStorage.get(key) || null;
      }
    }

    if (isAsyncStorageAvailable && AsyncStorage) {
      try {
        return await AsyncStorage.getItem(key);
      } catch (e: any) {
        const errMsg = e?.message || String(e);
        if (errMsg.includes('Native module is null') || errMsg.includes('cannot access legacy storage')) {
          console.warn('AsyncStorage native module is missing. Switching to in-memory storage fallback.');
          isAsyncStorageAvailable = false;
        } else {
          console.warn('AsyncStorage read error:', e);
        }
      }
    }

    return memoryStorage.get(key) || null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        memoryStorage.set(key, value);
        return;
      }
    }

    if (isAsyncStorageAvailable && AsyncStorage) {
      try {
        await AsyncStorage.setItem(key, value);
        return;
      } catch (e: any) {
        const errMsg = e?.message || String(e);
        if (errMsg.includes('Native module is null') || errMsg.includes('cannot access legacy storage')) {
          console.warn('AsyncStorage native module is missing. Switching to in-memory storage fallback.');
          isAsyncStorageAvailable = false;
        } else {
          console.warn('AsyncStorage write error:', e);
        }
      }
    }

    memoryStorage.set(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
        return;
      } catch (e) {
        memoryStorage.delete(key);
        return;
      }
    }

    if (isAsyncStorageAvailable && AsyncStorage) {
      try {
        await AsyncStorage.removeItem(key);
        return;
      } catch (e: any) {
        const errMsg = e?.message || String(e);
        if (errMsg.includes('Native module is null') || errMsg.includes('cannot access legacy storage')) {
          console.warn('AsyncStorage native module is missing. Switching to in-memory storage fallback.');
          isAsyncStorageAvailable = false;
        } else {
          console.warn('AsyncStorage delete error:', e);
        }
      }
    }

    memoryStorage.delete(key);
  }
};
