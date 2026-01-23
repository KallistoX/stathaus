/**
 * Abstract base class for storage adapters
 */
export class StorageAdapter {
  async init() {
    throw new Error('Method init() must be implemented')
  }

  async load() {
    throw new Error('Method load() must be implemented')
  }

  async save(data) {
    throw new Error('Method save() must be implemented')
  }

  async canUse() {
    throw new Error('Method canUse() must be implemented')
  }

  getName() {
    throw new Error('Method getName() must be implemented')
  }

  /**
   * Returns empty data structure
   */
  _getEmptyData() {
    return {
      version: '1.0',
      meterTypes: [],
      meters: [],
      readings: [],
      groups: [],
      tariffs: [],
      settings: {
        storageMode: 'indexeddb',
        currency: 'EUR',
        theme: 'dark'
      },
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }
  }
}