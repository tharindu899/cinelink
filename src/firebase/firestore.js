// src/firebase/firestore.js
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from './config';

const COL = { movies: 'movies', series: 'series', requests: 'requests' };

// ── Get a single entry ────────────────────────────────────────────────────────
export async function getEntry(type, tmdbId) {
  const col  = type === 'movie' ? COL.movies : COL.series;
  const ref  = doc(db, col, String(tmdbId));
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Save / update an entry (admin) ────────────────────────────────────────────
export async function saveEntry(type, tmdbId, data) {
  const col  = type === 'movie' ? COL.movies : COL.series;
  const ref  = doc(db, col, String(tmdbId));
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, { ...data, updated_at: serverTimestamp() });
  } else {
    await setDoc(ref, {
      ...data,
      tmdb_id:    tmdbId,
      type,
      added_date: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
}

// ── Delete an entry (admin) ───────────────────────────────────────────────────
export async function deleteEntry(type, tmdbId) {
  const col = type === 'movie' ? COL.movies : COL.series;
  await deleteDoc(doc(db, col, String(tmdbId)));
}

// ── Get all entries (admin) ───────────────────────────────────────────────────
export async function getAllEntries(type) {
  const col  = type === 'movie' ? COL.movies : COL.series;
  const snap = await getDocs(collection(db, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Real-time listener for all entries ────────────────────────────────────────
export function listenEntries(type, callback) {
  const col = type === 'movie' ? COL.movies : COL.series;
  const q   = query(collection(db, col), orderBy('added_date', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Check if a request already exists for this tmdb_id ───────────────────────
// Returns the existing request doc or null
export async function checkExistingRequest(tmdbId) {
  const q    = query(collection(db, COL.requests), where('tmdb_id', '==', tmdbId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// ── Submit a request (public) ─────────────────────────────────────────────────
export async function submitRequest(data) {
  await addDoc(collection(db, COL.requests), {
    ...data,
    requested_at: serverTimestamp(),
    status:       'pending',
  });
}

// ── Get all requests (admin) ──────────────────────────────────────────────────
export async function getAllRequests() {
  const q    = query(collection(db, COL.requests), orderBy('requested_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Real-time listener for requests ──────────────────────────────────────────
export function listenRequests(callback) {
  const q = query(collection(db, COL.requests), orderBy('requested_at', 'desc'));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Update request status (admin) ────────────────────────────────────────────
export async function updateRequestStatus(requestId, status) {
  await updateDoc(doc(db, COL.requests, requestId), { status });
}

// ── Delete a request (admin) ──────────────────────────────────────────────────
export async function deleteRequest(requestId) {
  await deleteDoc(doc(db, COL.requests, requestId));
}
