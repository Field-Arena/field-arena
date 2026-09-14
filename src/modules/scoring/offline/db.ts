'use client';

// Durable local storage for scoring writes made while offline — see
// docs/offline-mode-plan.md (Phase 3). This is intentionally outside the
// constants → types → schemas → data → hooks → ui layering: it's browser
// storage, not a Supabase concern, so it doesn't belong in `data/`.

const DB_NAME = 'fa-scoring-offline';
const DB_VERSION = 1;
const STORE = 'pending_writes';

export interface PendingWrite {
  id: string;
  actionName: string;
  payload: unknown;
  classId: string;
  createdAt: number;
  attempts: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('classId', 'classId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(new Error(req.error?.message ?? 'Failed to open offline database'));
    };
  });
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = run(tx.objectStore(STORE));
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(new Error(req.error?.message ?? 'Offline database request failed'));
    };
  });
}

export async function putPendingWrite(write: PendingWrite): Promise<void> {
  await withStore('readwrite', (store) => store.put(write));
}

export async function deletePendingWrite(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id));
}

export async function bumpAttempts(write: PendingWrite): Promise<void> {
  await putPendingWrite({ ...write, attempts: write.attempts + 1 });
}

export async function listPendingWrites(): Promise<PendingWrite[]> {
  try {
    const all = await withStore<PendingWrite[]>(
      'readonly',
      (store) => store.getAll() as IDBRequest<PendingWrite[]>,
    );
    return all.sort((a, b) => a.createdAt - b.createdAt);
  } catch {
    // No IndexedDB (older browser, private mode with storage disabled, etc.)
    // — offline durability just isn't available; the in-memory queue still
    // covers the common case of a short drop while the tab stays open.
    return [];
  }
}

export async function listPendingWritesForClass(classId: string): Promise<PendingWrite[]> {
  const all = await listPendingWrites();
  return all.filter((w) => w.classId === classId);
}
