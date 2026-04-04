// src/api/tmdb.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const API_KEY  = import.meta.env.VITE_TMDB_API_KEY;
export const IMG_BASE = import.meta.env.VITE_TMDB_IMAGE_BASE || 'https://image.tmdb.org/t/p';

const tmdb = axios.create({
  baseURL: BASE_URL,
  params: { api_key: API_KEY },
});

// ── Image helpers ─────────────────────────────────────────────────────────────
export const posterUrl    = (path, size = 'w500')    => path ? `${IMG_BASE}/${size}${path}` : null;
export const backdropUrl  = (path, size = 'w1280')   => path ? `${IMG_BASE}/${size}${path}` : null;
export const profileUrl   = (path, size = 'w185')    => path ? `${IMG_BASE}/${size}${path}` : null;

// ── Multi search ──────────────────────────────────────────────────────────────
export const searchMulti = (query, page = 1) =>
  tmdb.get('/search/multi', { params: { query, page, include_adult: false } })
      .then(r => r.data);

export const searchMovies = (query, page = 1) =>
  tmdb.get('/search/movie', { params: { query, page, include_adult: false } })
      .then(r => r.data);

export const searchTV = (query, page = 1) =>
  tmdb.get('/search/tv', { params: { query, page, include_adult: false } })
      .then(r => r.data);

// ── Movie ─────────────────────────────────────────────────────────────────────
export const getMovieDetails = (id) =>
  tmdb.get(`/movie/${id}`, {
    params: { append_to_response: 'credits,videos,similar,recommendations' },
  }).then(r => r.data);

// ── TV Series ─────────────────────────────────────────────────────────────────
export const getTVDetails = (id) =>
  tmdb.get(`/tv/${id}`, {
    params: { append_to_response: 'credits,videos,similar,recommendations' },
  }).then(r => r.data);

// ── Trending / Discover ───────────────────────────────────────────────────────
export const getTrending = (mediaType = 'all', timeWindow = 'week') =>
  tmdb.get(`/trending/${mediaType}/${timeWindow}`).then(r => r.data);

export const getPopularMovies = (page = 1) =>
  tmdb.get('/movie/popular', { params: { page } }).then(r => r.data);

export const getPopularTV = (page = 1) =>
  tmdb.get('/tv/popular', { params: { page } }).then(r => r.data);

export const getTopRatedMovies = (page = 1) =>
  tmdb.get('/movie/top_rated', { params: { page } }).then(r => r.data);

export const getNowPlaying = (page = 1) =>
  tmdb.get('/movie/now_playing', { params: { page } }).then(r => r.data);

// ── Genres ────────────────────────────────────────────────────────────────────
export const getMovieGenres = () =>
  tmdb.get('/genre/movie/list').then(r => r.data.genres);

export const getTVGenres = () =>
  tmdb.get('/genre/tv/list').then(r => r.data.genres);
