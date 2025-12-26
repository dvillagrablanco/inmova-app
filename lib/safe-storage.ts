/**
 * Safe Storage - Wrapper seguro para localStorage/sessionStorage
 * Funciona en modo incógnito y cuando el storage no está disponible
 */

// Verificar si el storage está disponible
function isStorageAvailable(type: 'localStorage' | 'sessionStorage'): boolean {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Cache en memoria como fallback
const memoryStorage: Record<string, string> = {};

/**
 * Safe localStorage wrapper
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (isStorageAvailable('localStorage')) {
        return localStorage.getItem(key);
      }
      return memoryStorage[key] || null;
    } catch (error) {
      console.warn('localStorage.getItem failed:', error);
      return memoryStorage[key] || null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      if (isStorageAvailable('localStorage')) {
        localStorage.setItem(key, value);
      }
      memoryStorage[key] = value;
    } catch (error) {
      console.warn('localStorage.setItem failed:', error);
      memoryStorage[key] = value;
    }
  },

  removeItem(key: string): void {
    try {
      if (isStorageAvailable('localStorage')) {
        localStorage.removeItem(key);
      }
      delete memoryStorage[key];
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error);
      delete memoryStorage[key];
    }
  },

  clear(): void {
    try {
      if (isStorageAvailable('localStorage')) {
        localStorage.clear();
      }
      Object.keys(memoryStorage).forEach((key) => delete memoryStorage[key]);
    } catch (error) {
      console.warn('localStorage.clear failed:', error);
      Object.keys(memoryStorage).forEach((key) => delete memoryStorage[key]);
    }
  },
};

/**
 * Safe sessionStorage wrapper
 */
export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      if (isStorageAvailable('sessionStorage')) {
        return sessionStorage.getItem(key);
      }
      return memoryStorage[`session_${key}`] || null;
    } catch (error) {
      console.warn('sessionStorage.getItem failed:', error);
      return memoryStorage[`session_${key}`] || null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      if (isStorageAvailable('sessionStorage')) {
        sessionStorage.setItem(key, value);
      }
      memoryStorage[`session_${key}`] = value;
    } catch (error) {
      console.warn('sessionStorage.setItem failed:', error);
      memoryStorage[`session_${key}`] = value;
    }
  },

  removeItem(key: string): void {
    try {
      if (isStorageAvailable('sessionStorage')) {
        sessionStorage.removeItem(key);
      }
      delete memoryStorage[`session_${key}`];
    } catch (error) {
      console.warn('sessionStorage.removeItem failed:', error);
      delete memoryStorage[`session_${key}`];
    }
  },

  clear(): void {
    try {
      if (isStorageAvailable('sessionStorage')) {
        sessionStorage.clear();
      }
      Object.keys(memoryStorage)
        .filter((key) => key.startsWith('session_'))
        .forEach((key) => delete memoryStorage[key]);
    } catch (error) {
      console.warn('sessionStorage.clear failed:', error);
      Object.keys(memoryStorage)
        .filter((key) => key.startsWith('session_'))
        .forEach((key) => delete memoryStorage[key]);
    }
  },
};
