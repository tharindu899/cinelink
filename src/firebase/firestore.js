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

// ── Get a single entry (one-time) ─────────────────────────────────────────────
export async function getEntry(type, tmdbId) {
  const col  = type === 'movie' ? COL.movies : COL.series;
  const ref  = doc(db, col, String(tmdbId));
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ── Real-time listener for a single entry ─────────────────────────────────────
export function listenEntry(type, tmdbId, callback) {
  const col = type === 'movie' ? COL.movies : COL.series;
  return onSnapshot(doc(db, col, String(tmdbId)), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
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

// ── Episodes subcollection (under series) ─────────────────────────────────────
// ID format: s01e03 (zero-padded)

export async function getEpisodes(seriesId) {
  const snap = await getDocs(collection(db, 'series', String(seriesId), 'episodes'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.season !== b.season ? a.season - b.season : a.episode - b.episode);
}

export async function saveEpisode(seriesId, season, episode, data) {
  const epId = `s${String(season).padStart(2, '0')}e${String(episode).padStart(2, '0')}`;
  const ref  = doc(db, 'series', String(seriesId), 'episodes', epId);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, {
      ...data,
      season:     Number(season),
      episode:    Number(episode),
      updated_at: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      ...data,
      season:     Number(season),
      episode:    Number(episode),
      added_date: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  }
}

export async function deleteEpisode(seriesId, episodeId) {
  await deleteDoc(doc(db, 'series', String(seriesId), 'episodes', episodeId));
}

export function listenEpisodes(seriesId, callback) {
  return onSnapshot(
    collection(db, 'series', String(seriesId), 'episodes'),
    snap => {
      const episodes = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => a.season !== b.season ? a.season - b.season : a.episode - b.episode);
      callback(episodes);
    }
  );
}

// ── Check if a request already exists ────────────────────────────────────────
// Uses a composite request_key: "tmdbId" or "tmdbId_s1e3" for episode requests
export async function checkExistingRequest(tmdbId, season = null, episode = null) {
  const key = (season != null && episode != null)
    ? `${tmdbId}_s${season}e${episode}`
    : String(tmdbId);

  const q    = query(collection(db, COL.requests), where('request_key', '==', key));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

// ── Submit a request (public) ─────────────────────────────────────────────────
export async function submitRequest(data) {
  const { tmdb_id, season, episode } = data;
  const request_key = (season != null && episode != null)
    ? `${tmdb_id}_s${season}e${episode}`
    : String(tmdb_id);

  await addDoc(collection(db, COL.requests), {
    ...data,
    request_key,
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
