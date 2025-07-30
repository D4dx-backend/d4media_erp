import {
  cacheData,
  getCachedData,
  clearCache,
  queueOfflineAction,
  getOfflineActions,
  removeOfflineAction,
  isOnline,
  onNetworkChange,
  syncOfflineData
} from '../offlineCache'

// Mock IndexedDB
const mockIndexedDB = {
  open: jest.fn(),
  transaction: jest.fn(),
  objectStore: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn()
}

// Mock storage instance
const mockStorage = {
  init: jest.fn().mockResolvedValue({}),
  get: jest.fn(),
  getAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn()
}

// Mock fetch
global.fetch = jest.fn()

describe('Offline Cache Utilities', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    })
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn().mockReturnValue('mock-token')
    
    // Mock window event listeners
    window.addEventListener = jest.fn()
    window.removeEventListener = jest.fn()
  })
  
  describe('Cache Operations', () => {
    test('cacheData stores data in offline storage', async () => {
      // Mock implementation
      mockStorage.put.mockResolvedValue(undefined)
      
      // Test single item
      const testData = { id: 1, name: 'Test Item' }
      await cacheData('tasks', testData)
      
      expect(mockStorage.put).toHaveBeenCalledWith('tasks', testData)
      
      // Test array of items
      const testArray = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
      
      mockStorage.put.mockClear()
      await cacheData('tasks', testArray)
      
      expect(mockStorage.put).toHaveBeenCalledTimes(2)
      expect(mockStorage.put).toHaveBeenCalledWith('tasks', testArray[0])
      expect(mockStorage.put).toHaveBeenCalledWith('tasks', testArray[1])
    })
    
    test('getCachedData retrieves data from offline storage', async () => {
      // Mock implementation for single item
      const testData = { id: 1, name: 'Test Item' }
      mockStorage.get.mockResolvedValue(testData)
      
      // Get single item
      const result = await getCachedData('tasks', 1)
      
      expect(mockStorage.get).toHaveBeenCalledWith('tasks', 1)
      expect(result).toEqual(testData)
      
      // Mock implementation for all items
      const testArray = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
      mockStorage.getAll.mockResolvedValue(testArray)
      
      // Get all items
      const allResults = await getCachedData('tasks')
      
      expect(mockStorage.getAll).toHaveBeenCalledWith('tasks')
      expect(allResults).toEqual(testArray)
    })
    
    test('clearCache removes all data of a type', async () => {
      // Mock implementation
      mockStorage.clear.mockResolvedValue(undefined)
      
      await clearCache('tasks')
      
      expect(mockStorage.clear).toHaveBeenCalledWith('tasks')
    })
  })
  
  describe('Offline Actions', () => {
    test('queueOfflineAction stores action for later processing', async () => {
      // Mock implementation
      mockStorage.put.mockResolvedValue(undefined)
      
      const testAction = {
        type: 'task_update',
        method: 'PUT',
        url: '/api/v1/tasks/1',
        data: { status: 'completed' }
      }
      
      await queueOfflineAction(testAction)
      
      expect(mockStorage.put).toHaveBeenCalledWith(
        'offlineActions',
        expect.objectContaining({
          ...testAction,
          timestamp: expect.any(Number),
          id: expect.any(String)
        })
      )
    })
    
    test('getOfflineActions retrieves queued actions', async () => {
      // Mock implementation
      const testActions = [
        {
          id: 'action1',
          type: 'task_update',
          timestamp: Date.now()
        },
        {
          id: 'action2',
          type: 'task_create',
          timestamp: Date.now()
        }
      ]
      
      mockStorage.getAll.mockResolvedValue(testActions)
      
      const result = await getOfflineActions()
      
      expect(mockStorage.getAll).toHaveBeenCalledWith('offlineActions')
      expect(result).toEqual(testActions)
    })
    
    test('removeOfflineAction deletes a processed action', async () => {
      // Mock implementation
      mockStorage.delete.mockResolvedValue(undefined)
      
      await removeOfflineAction('action1')
      
      expect(mockStorage.delete).toHaveBeenCalledWith('offlineActions', 'action1')
    })
  })
  
  describe('Network Status', () => {
    test('isOnline returns navigator.onLine value', () => {
      // Test online
      Object.defineProperty(navigator, 'onLine', { value: true })
      expect(isOnline()).toBe(true)
      
      // Test offline
      Object.defineProperty(navigator, 'onLine', { value: false })
      expect(isOnline()).toBe(false)
    })
    
    test('onNetworkChange sets up event listeners', () => {
      const callback = jest.fn()
      
      const cleanup = onNetworkChange(callback)
      
      // Check if event listeners were added
      expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
      
      // Call cleanup function
      cleanup()
      
      // Check if event listeners were removed
      expect(window.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(window.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })
  
  describe('Sync Operations', () => {
    test('syncOfflineData processes queued actions when online', async () => {
      // Mock online status
      Object.defineProperty(navigator, 'onLine', { value: true })
      
      // Mock actions
      const testActions = [
        {
          id: 'action1',
          type: 'task_update',
          method: 'PUT',
          url: '/api/v1/tasks/1',
          data: { status: 'completed' },
          timestamp: Date.now()
        },
        {
          id: 'action2',
          type: 'task_create',
          method: 'POST',
          url: '/api/v1/tasks',
          data: { title: 'New Task' },
          timestamp: Date.now()
        }
      ]
      
      // Mock implementations
      mockStorage.getAll.mockResolvedValue(testActions)
      mockStorage.delete.mockResolvedValue(undefined)
      global.fetch.mockResolvedValue({})
      
      await syncOfflineData()
      
      // Check if actions were processed
      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(mockStorage.delete).toHaveBeenCalledTimes(2)
    })
    
    test('syncOfflineData does nothing when offline', async () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', { value: false })
      
      await syncOfflineData()
      
      // Check that no actions were processed
      expect(mockStorage.getAll).not.toHaveBeenCalled()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})