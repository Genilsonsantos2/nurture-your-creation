import { openDB } from 'idb';

const DB_NAME = 'ceti-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'sync-queue';

// Basic wrapper around idb
export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                // Key path is autoincremented to keep a chronological queue
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

export const saveToSyncQueue = async (actionType: 'movement', payload: any) => {
    try {
        const db = await initDB();
        await db.add(STORE_NAME, {
            action_type: actionType,
            payload,
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error("Failed to save to offline queue", error);
        return false;
    }
};

export const getSyncQueue = async () => {
    try {
        const db = await initDB();
        return await db.getAll(STORE_NAME);
    } catch (error) {
        console.error("Failed to get offline queue", error);
        return [];
    }
};

export const removeFromSyncQueue = async (id: number) => {
    try {
        const db = await initDB();
        await db.delete(STORE_NAME, id);
    } catch (error) {
        console.error("Failed to remove from offline queue", error);
    }
};
