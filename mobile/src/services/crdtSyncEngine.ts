import AsyncStorage from '@react-native-async-storage/async-storage';

export type VectorClock = Record<string, number>;

export type CRDTOperation = {
  id: string;
  entityType: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
  deviceId: string;
  vectorClock: VectorClock;
};

const SYNC_QUEUE_KEY = 'hisabhero_crdt_sync_queue';
const DEVICE_ID_KEY = 'hisabhero_device_uuid';

/**
 * Get or initialize persistent Device UUID for CRDT vector clock
 */
export async function getDeviceId(): Promise<string> {
  try {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return 'dev_fallback_' + Date.now();
  }
}

/**
 * Compare two vector clocks to determine causality (Dominates / Concurrent / Equal)
 */
export function compareVectorClocks(v1: VectorClock, v2: VectorClock): 'DOMINATES' | 'SUBORDINATE' | 'CONCURRENT' | 'EQUAL' {
  const keys = Array.from(new Set([...Object.keys(v1), ...Object.keys(v2)]));
  let v1Greater = false;
  let v2Greater = false;

  for (const k of keys) {
    const val1 = v1[k] || 0;
    const val2 = v2[k] || 0;
    if (val1 > val2) v1Greater = true;
    if (val2 > val1) v2Greater = true;
  }

  if (v1Greater && !v2Greater) return 'DOMINATES';
  if (v2Greater && !v1Greater) return 'SUBORDINATE';
  if (!v1Greater && !v2Greater) return 'EQUAL';
  return 'CONCURRENT';
}

/**
 * Enqueue offline CRDT operation with vector clock timestamp
 */
export async function enqueueOfflineOperation(
  entityType: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  payload: any
): Promise<CRDTOperation> {
  const deviceId = await getDeviceId();
  const queueJson = (await AsyncStorage.getItem(SYNC_QUEUE_KEY)) || '[]';
  const queue: CRDTOperation[] = JSON.parse(queueJson);

  const localClock: VectorClock = {};
  queue.forEach((op) => {
    localClock[op.deviceId] = (localClock[op.deviceId] || 0) + 1;
  });
  localClock[deviceId] = (localClock[deviceId] || 0) + 1;

  const operation: CRDTOperation = {
    id: 'op_' + Math.random().toString(36).substring(2, 9),
    entityType,
    action,
    payload,
    timestamp: Date.now(),
    deviceId,
    vectorClock: localClock,
  };

  queue.push(operation);
  await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  console.log(`📡 [CRDT] Enqueued offline mutation (${action} ${entityType}) vectorClock:`, localClock);
  return operation;
}

/**
 * Resolve concurrent state conflict using Last-Write-Wins (LWW) + Vector Clock dominance
 */
export function resolveCRDTConflict(localOp: CRDTOperation, remoteOp: CRDTOperation): CRDTOperation {
  const comparison = compareVectorClocks(localOp.vectorClock, remoteOp.vectorClock);
  if (comparison === 'DOMINATES') return localOp;
  if (comparison === 'SUBORDINATE') return remoteOp;

  // Concurrent edits: Fallback to physical timestamp + device lexicographical tie-breaker
  if (localOp.timestamp > remoteOp.timestamp) return localOp;
  if (remoteOp.timestamp > localOp.timestamp) return remoteOp;
  return localOp.deviceId > remoteOp.deviceId ? localOp : remoteOp;
}
