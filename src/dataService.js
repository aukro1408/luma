import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "./firebase"

const GUEST_KEY = "luma_guest_data"

function getGuestStore() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || "{}")
  } catch {
    return {}
  }
}

function saveGuestStore(store) {
  localStorage.setItem(GUEST_KEY, JSON.stringify(store))
}

export function getDocPath(user, collection, docId) {
  if (!user) return null
  return doc(db, `users/${user.id}/${collection}/${docId}`)
}

export async function getDocData(user, collection, docId) {
  if (user) {
    const snap = await getDoc(getDocPath(user, collection, docId))
    return snap.exists() ? snap.data() : null
  }
  const store = getGuestStore()
  return store[collection]?.[docId] || null
}

export async function setDocData(user, collection, docId, data, options) {
  if (user) {
    await setDoc(getDocPath(user, collection, docId), data, options)
  } else {
    const store = getGuestStore()
    if (!store[collection]) store[collection] = {}
    store[collection][docId] = data
    saveGuestStore(store)
  }
}

export async function updateDocData(user, collection, docId, updates) {
  if (user) {
    await updateDoc(getDocPath(user, collection, docId), updates)
  } else {
    const store = getGuestStore()
    if (!store[collection]) store[collection] = {}
    const current = store[collection][docId] || {}
    store[collection][docId] = { ...current, ...updates }
    saveGuestStore(store)
  }
}

export function subscribeToDoc(user, collection, docId, callback) {
  if (user) {
    return onSnapshot(getDocPath(user, collection, docId), (snap) => {
      callback(snap.exists() ? snap.data() : null)
    })
  }
  const store = getGuestStore()
  const data = store[collection]?.[docId] || null
  setTimeout(() => callback(data), 0)

  const handler = (e) => {
    if (e.key === GUEST_KEY) {
      const newStore = getGuestStore()
      callback(newStore[collection]?.[docId] || null)
    }
  }
  window.addEventListener("storage", handler)
  return () => window.removeEventListener("storage", handler)
}

export async function queryCollectionByDocId(user, collection, docId) {
  if (user) {
    const q = query(collection(db, `users/${user.id}/${collection}`), where("__name__", "==", docId))
    const snap = await getDocs(q)
    if (snap.empty) return null
    return snap.docs[0].data()
  }
  const store = getGuestStore()
  return store[collection]?.[docId] || null
}

export async function getAllCollectionDocs(user, collection) {
  if (user) {
    const q = query(collection(db, `users/${user.id}/${collection}`))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }
  const store = getGuestStore()
  return Object.entries(store[collection] || {}).map(([id, data]) => ({ id, ...data }))
}