import { useEffect, useState } from "react";
import {
  collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, getDocs,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { seedEstablishments, seedReviews, seedLists } from "./seed";

function localKey(name) {
  return `aprovado:${name}`;
}

function readLocal(name) {
  try {
    return JSON.parse(localStorage.getItem(localKey(name))) || [];
  } catch {
    return [];
  }
}

function writeLocal(name, items, listeners) {
  localStorage.setItem(localKey(name), JSON.stringify(items));
  listeners.forEach((cb) => cb(items));
}

function createCollectionApi(name) {
  if (isFirebaseConfigured) {
    const colRef = collection(db, name);
    return {
      subscribe(cb) {
        return onSnapshot(colRef, (snap) => {
          cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });
      },
      async setById(id, data) {
        await setDoc(doc(db, name, id), data, { merge: true });
      },
      async update(id, data) {
        await updateDoc(doc(db, name, id), data);
      },
      async remove(id) {
        await deleteDoc(doc(db, name, id));
      },
      async isEmpty() {
        const snap = await getDocs(colRef);
        return snap.empty;
      },
    };
  }

  const listeners = new Set();
  return {
    subscribe(cb) {
      listeners.add(cb);
      cb(readLocal(name));
      return () => listeners.delete(cb);
    },
    async setById(id, data) {
      const items = readLocal(name);
      const idx = items.findIndex((it) => it.id === id);
      if (idx === -1) items.push({ id, ...data });
      else items[idx] = { ...items[idx], ...data };
      writeLocal(name, items, listeners);
    },
    async update(id, data) {
      writeLocal(name, readLocal(name).map((it) => (it.id === id ? { ...it, ...data } : it)), listeners);
    },
    async remove(id) {
      writeLocal(name, readLocal(name).filter((it) => it.id !== id), listeners);
    },
    async isEmpty() {
      return readLocal(name).length === 0;
    },
  };
}

export const establishmentsApi = createCollectionApi("establishments");
export const reviewsApi = createCollectionApi("reviews");
export const listsApi = createCollectionApi("lists");

let seedingStarted = false;

export async function ensureSeeded() {
  if (seedingStarted) return;
  seedingStarted = true;
  const empty = await establishmentsApi.isEmpty();
  if (!empty) return;
  await Promise.all(seedEstablishments.map((e) => establishmentsApi.setById(e.id, e)));
  await Promise.all(seedReviews.map((r) => reviewsApi.setById(r.id, r)));
  await Promise.all(seedLists.map((l) => listsApi.setById(l.id, l)));
}

function useCollection(api) {
  const [items, setItems] = useState([]);
  useEffect(() => api.subscribe(setItems), [api]);
  return items;
}

export function useEstablishments() {
  return useCollection(establishmentsApi);
}

export function useReviews() {
  return useCollection(reviewsApi);
}

export function useLists() {
  return useCollection(listsApi);
}

function nextId() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function addEstablishment(data) {
  const id = nextId();
  await establishmentsApi.setById(id, { promos: [], tags: [], ...data });
  return id;
}

export async function addReview(data) {
  const id = nextId();
  await reviewsApi.setById(id, { comment: "", tags: [], flagged: false, flagReason: null, ...data });
  return id;
}

export async function addList(data) {
  const id = nextId();
  await listsApi.setById(id, { members: ["Você"], placeIds: [], visited: [], ...data });
  return id;
}
