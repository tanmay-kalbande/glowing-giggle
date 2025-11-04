
import { Business, Category } from './types';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// IndexedDB Schema
interface JawalaDB extends DBSchema {
  businesses: {
    key: string;
    value: Business & { _synced_at: number };
  };
  categories: {
    key: string;
    value: Category;
  };
  metadata: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'jawala-business-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<JawalaDB> | null = null;

// Initialize IndexedDB
export async function initDB(): Promise<IDBPDatabase<JawalaDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<JawalaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('businesses')) {
        db.createObjectStore('businesses', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// ============================================
// Metadata Management
// ============================================

export async function getMetadata(key: string): Promise<any | null> {
  const db = await initDB();
  const data = await db.get('metadata', key);
  return data ? data.value : null;
}

export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await initDB();
  await db.put('metadata', { key, value });
}

// ============================================
// Data Version/Count Tracking
// ============================================

export interface DataVersion {
  business_count: number;
  last_updated: string; // ISO timestamp of last change
  last_sync: number; // Local timestamp of last successful sync
}

export async function getLocalVersion(): Promise<DataVersion | null> {
  return await getMetadata('data_version');
}

export async function setLocalVersion(version: DataVersion): Promise<void> {
  await setMetadata('data_version', version);
}

// ============================================
// Categories Caching
// ============================================

export async function getCachedCategories(): Promise<Category[]> {
  const db = await initDB();
  return await db.getAll('categories');
}

export async function setCachedCategories(categories: Category[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('categories', 'readwrite');
  await tx.store.clear();
  for (const category of categories) {
    await tx.store.put(category);
  }
  await tx.done;
}

// ============================================
// Businesses Caching
// ============================================

export async function getCachedBusinesses(): Promise<Business[]> {
  const db = await initDB();
  const businesses = await db.getAll('businesses');
  return businesses.map(b => {
    const { _synced_at, ...business } = b;
    return business as Business;
  });
}

export async function setCachedBusinesses(businesses: Business[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction('businesses', 'readwrite');
  await tx.store.clear();
  const now = Date.now();
  for (const business of businesses) {
    await tx.store.put({ ...business, _synced_at: now });
  }
  await tx.done;
}

export async function updateCachedBusiness(business: Business): Promise<void> {
  const db = await initDB();
  await db.put('businesses', { ...business, _synced_at: Date.now() });
}

export async function deleteCachedBusiness(businessId: string): Promise<void> {
  const db = await initDB();
  await db.delete('businesses', businessId);
}

// ============================================
// Sync Strategy Functions
// ============================================

export interface SyncResult {
  action: 'no_change' | 'full_sync';
  businesses: Business[];
  categories: Category[];
  fromCache: boolean;
}

export async function checkSyncNeeded(remoteVersion: DataVersion): Promise<'no_change' | 'full_sync'> {
  const localVersion = await getLocalVersion();
  
  if (!localVersion) return 'full_sync';
  if (localVersion.business_count !== remoteVersion.business_count) return 'full_sync';
  if (localVersion.last_updated !== remoteVersion.last_updated) return 'full_sync';
  
  return 'no_change';
}

export async function smartSync(
  fetchRemoteVersion: () => Promise<DataVersion>,
  fetchAllData: () => Promise<{ businesses: Business[]; categories: Category[] }>
): Promise<SyncResult> {
  try {
    const remoteVersion = await fetchRemoteVersion();
    const syncAction = await checkSyncNeeded(remoteVersion);
    
    if (syncAction === 'no_change') {
      const [businesses, categories] = await Promise.all([ getCachedBusinesses(), getCachedCategories() ]);
      return { action: 'no_change', businesses, categories, fromCache: true };
    }
    
    const { businesses, categories } = await fetchAllData();
    await Promise.all([
      setCachedBusinesses(businesses),
      setCachedCategories(categories),
      setLocalVersion({ ...remoteVersion, last_sync: Date.now() }),
    ]);
    
    return { action: 'full_sync', businesses, categories, fromCache: false };
    
  } catch (error) {
    console.error('❌ Sync failed, using cached data:', error);
    const [businesses, categories] = await Promise.all([ getCachedBusinesses(), getCachedCategories() ]);
    return { action: 'no_change', businesses, categories, fromCache: true };
  }
}
