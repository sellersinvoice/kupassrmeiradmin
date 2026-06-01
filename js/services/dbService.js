// /js/services/dbService.js

import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  query,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function getItem(collectionName, id) {
  const snap = await getDoc(doc(db, collectionName, id));

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data()
  };
}

export async function getByField(collectionName, field, value) {
  const q = query(
    collection(db, collectionName),
    where(field, "==", value),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) return null;

  const docSnap = snap.docs[0];

  return {
    id: docSnap.id,
    ...docSnap.data()
  };
}

// 📥 GET collection
export async function getCollection(name) {
  const snap = await getDocs(collection(db, name));

  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
}


// ➕ ADD
export async function addItem(collectionName, data) {
  const res = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Date.now()
  });

  return res.id;
}


// ✏️ UPDATE
export async function updateItem(collectionName, id, data) {
  await updateDoc(doc(db, collectionName, id), data);
}


// ❌ DELETE
export async function deleteItem(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

export async function setItem(collectionName, id, data) {
  await setDoc(doc(db, collectionName, id), data, { merge: true });
}