import Dexie from 'dexie';

const db = new Dexie('8TrackDB');

db.version(1).stores({
    // Cached data from API (for offline reads)
    subjects: '++id, userId, name, status',
    attendance: '++id, subjectId, date, status',
    assignments: '++id, userId, subjectId, dueDate, status',
    tasks: '++id, userId, completed, priority',

    // Sync queue: tracks writes made offline
    // op: 'POST' | 'PUT' | 'DELETE'
    syncQueue: '++id, resource, op, synced, createdAt',
});

export default db;

/**
 * Add an action to the sync queue (called when offline)
 */
export const addToSyncQueue = async (resource, op, payload) => {
    await db.syncQueue.add({
        resource,     // e.g. '/attendance'
        op,           // 'POST' | 'PUT' | 'DELETE'
        payload,      // request body or { id } for DELETE
        synced: false,
        createdAt: new Date(),
    });
};
