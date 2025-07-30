/**
 * Offline caching utilities for PWA functionality
 */

// IndexedDB wrapper for offline data storage
class OfflineStorage {
  constructor(dbName = 'd4-media-offline', version = 1) {
    this.dbName = dbName
    this.version = version
    this.db = null
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create object stores
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: '_id' })
          taskStore.createIndex('status', 'status', { unique: false })
          taskStore.createIndex('assignedTo', 'assignedTo', { unique: false })
          taskStore.createIndex('department', 'department', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: '_id' })
        }
        
        if (!db.objectStoreNames.contains('departments')) {
          db.createObjectStore('departments', { keyPath: '_id' })
        }
        
        if (!db.objectStoreNames.contains('offlineActions')) {
          const actionStore = db.createObjectStore('offlineActions', { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          actionStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async get(storeName, key) {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAll(storeName, indexName = null, query = null) {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      
      let request
      if (indexName && query) {
        const index = store.index(indexName)
        request = index.getAll(query)
      } else {
        request = store.getAll()
      }
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async put(storeName, data) {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async delete(storeName, key) {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async clear(storeName) {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorage()

// Cache management functions
export const cacheData = async (type, data) => {
  try {
    if (Array.isArray(data)) {
      // Cache multiple items
      for (const item of data) {
        await offlineStorage.put(type, item)
      }
    } else {
      // Cache single item
      await offlineStorage.put(type, data)
    }
    console.log(`Cached ${type} data offline`)
  } catch (error) {
    console.error(`Failed to cache ${type} data:`, error)
  }
}

export const getCachedData = async (type, key = null) => {
  try {
    if (key) {
      return await offlineStorage.get(type, key)
    } else {
      return await offlineStorage.getAll(type)
    }
  } catch (error) {
    console.error(`Failed to get cached ${type} data:`, error)
    return null
  }
}

export const clearCache = async (type) => {
  try {
    await offlineStorage.clear(type)
    console.log(`Cleared ${type} cache`)
  } catch (error) {
    console.error(`Failed to clear ${type} cache:`, error)
  }
}

// Offline action queue
export const queueOfflineAction = async (action) => {
  try {
    const actionWithTimestamp = {
      ...action,
      timestamp: Date.now(),
      id: `${action.type}_${Date.now()}_${Math.random()}`
    }
    
    await offlineStorage.put('offlineActions', actionWithTimestamp)
    console.log('Queued offline action:', actionWithTimestamp)
    
    // Register background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('background-sync')
    }
  } catch (error) {
    console.error('Failed to queue offline action:', error)
  }
}

export const getOfflineActions = async () => {
  try {
    return await offlineStorage.getAll('offlineActions')
  } catch (error) {
    console.error('Failed to get offline actions:', error)
    return []
  }
}

export const removeOfflineAction = async (actionId) => {
  try {
    await offlineStorage.delete('offlineActions', actionId)
    console.log('Removed offline action:', actionId)
  } catch (error) {
    console.error('Failed to remove offline action:', error)
  }
}

// Network status detection
export const isOnline = () => {
  return navigator.onLine
}

export const onNetworkChange = (callback) => {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Sync cached data when online
export const syncOfflineData = async () => {
  if (!isOnline()) return
  
  try {
    const actions = await getOfflineActions()
    
    for (const action of actions) {
      try {
        // Process the offline action
        await processOfflineAction(action)
        await removeOfflineAction(action.id)
      } catch (error) {
        console.error('Failed to sync offline action:', error)
      }
    }
    
    console.log('Offline data sync completed')
  } catch (error) {
    console.error('Failed to sync offline data:', error)
  }
}

// Process individual offline actions
const processOfflineAction = async (action) => {
  const { type, data, method, url } = action
  
  switch (type) {
    case 'task_update':
      // Replay task update
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })
      break
      
    case 'task_create':
      // Replay task creation
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      })
      break
      
    default:
      console.warn('Unknown offline action type:', type)
  }
}

// Initialize offline storage
export const initOfflineStorage = async () => {
  try {
    await offlineStorage.init()
    console.log('Offline storage initialized')
    
    // Set up network change listener
    onNetworkChange((online) => {
      if (online) {
        console.log('Network restored, syncing offline data...')
        syncOfflineData()
      } else {
        console.log('Network lost, switching to offline mode')
      }
    })
  } catch (error) {
    console.error('Failed to initialize offline storage:', error)
  }
}

// Task-specific cache functions
export const getCachedTasks = async (filters = {}) => {
  try {
    let tasks = await getCachedData('tasks');
    
    // Apply filters if provided
    if (filters) {
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }
      
      if (filters.priority) {
        tasks = tasks.filter(task => task.priority === filters.priority);
      }
      
      if (filters.department) {
        tasks = tasks.filter(task => 
          task.department && task.department._id === filters.department
        );
      }
      
      if (filters.assignedTo) {
        tasks = tasks.filter(task => 
          task.assignedTo && task.assignedTo._id === filters.assignedTo
        );
      }
    }
    
    return tasks || [];
  } catch (error) {
    console.error('Failed to get cached tasks:', error);
    return [];
  }
};

export const cacheTasks = async (tasks) => {
  try {
    await cacheData('tasks', tasks);
    console.log(`Cached ${tasks.length} tasks for offline use`);
    return true;
  } catch (error) {
    console.error('Failed to cache tasks:', error);
    return false;
  }
};

export default offlineStorage;