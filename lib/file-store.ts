"use client"

type StoredFileRecord = {
  id: string
  name: string
  blob: Blob
  updatedAt: number
}

const DB_NAME = "1key-file-store"
const DB_VERSION = 1
const STORE_NAME = "files"

let openPromise: Promise<IDBDatabase> | null = null

const openDb = () => {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB not available"))
  }
  if (openPromise) return openPromise

  const attempt = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"))
  })

  void attempt.catch(() => {
    if (openPromise === attempt) openPromise = null
  })

  openPromise = attempt
  return attempt
}

const withStore = async <T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const db = await openDb()
  return await new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode)
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"))
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"))
    const store = tx.objectStore(STORE_NAME)
    const request = fn(store)

    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"))
    request.onsuccess = () => {
      const result = request.result
      if (mode === "readonly") {
        resolve(result)
        return
      }
      tx.oncomplete = () => resolve(result)
    }
  })
}

export const putFile = async (record: StoredFileRecord) => {
  await withStore("readwrite", (store) => store.put(record))
}

export const getFile = async (id: string): Promise<StoredFileRecord | null> => {
  const result = await withStore("readonly", (store) => store.get(id))
  return (result as unknown as StoredFileRecord | undefined) ?? null
}

export const deleteFile = async (id: string) => {
  await withStore("readwrite", (store) => store.delete(id))
}
