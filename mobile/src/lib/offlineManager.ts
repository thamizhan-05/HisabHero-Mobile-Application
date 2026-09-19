import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';

export interface PendingMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  createdAt: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  error?: string;
}

const OFFLINE_QUEUE_KEY = 'hisabhero_offline_queue_v1';

export const offlineManager = {
  // Get all pending mutations from local storage
  getQueue: async (): Promise<PendingMutation[]> => {
    try {
      const json = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.warn('Failed to read offline queue:', e);
      return [];
    }
  },

  // Save queue to local storage
  saveQueue: async (queue: PendingMutation[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to save offline queue:', e);
    }
  },

  // Add a new mutation to offline queue when device is offline or request fails
  enqueue: async (endpoint: string, method: 'POST' | 'PUT' | 'DELETE', payload: any): Promise<PendingMutation> => {
    const queue = await offlineManager.getQueue();
    const newMutation: PendingMutation = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      endpoint,
      method,
      payload,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0,
    };
    queue.push(newMutation);
    await offlineManager.saveQueue(queue);
    return newMutation;
  },

  // Remove mutation by ID
  dequeue: async (id: string): Promise<void> => {
    let queue = await offlineManager.getQueue();
    queue = queue.filter((m) => m.id !== id);
    await offlineManager.saveQueue(queue);
  },

  // Process all queued offline mutations with server
  processQueue: async (): Promise<{ synced: number; failed: number }> => {
    const queue = await offlineManager.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let syncedCount = 0;
    let failedCount = 0;
    const updatedQueue: PendingMutation[] = [];

    for (const item of queue) {
      try {
        let res;
        if (item.method === 'POST') {
          res = await apiClient.post(item.endpoint, item.payload);
        } else if (item.method === 'PUT') {
          res = await apiClient.put(item.endpoint, item.payload);
        } else {
          res = await apiClient.delete(item.endpoint);
        }

        if (res.ok) {
          syncedCount++;
        } else {
          item.retryCount += 1;
          item.status = 'failed';
          item.error = `HTTP ${res.status}`;
          updatedQueue.push(item);
          failedCount++;
        }
      } catch (err: any) {
        item.retryCount += 1;
        item.status = 'failed';
        item.error = err.message || 'Network error';
        updatedQueue.push(item);
        failedCount++;
      }
    }

    await offlineManager.saveQueue(updatedQueue);
    return { synced: syncedCount, failed: failedCount };
  },

  // Clear all queue items
  clearQueue: async (): Promise<void> => {
    await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
  },
};
