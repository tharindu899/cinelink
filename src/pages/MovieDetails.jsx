// src/pages/MovieDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiStar, FiClock, FiCalendar, FiExternalLink,
  FiTag, FiMessageSquare, FiAlertCircle, FiPlay,
  FiFilm, FiDollarSign, FiUsers,
} from 'react-icons/fi';
import { getMovieDetails, backdropUrl, posterUrl } from '../api/tmdb';
import { getEntry } from '../firebase/firestore';
import CastCard from '../components/CastCard';
import MovieCard from '../components/MovieCard';
import RequestModal from '../components/RequestModal';
import { DetailsSkeleton } from '../components/LoadingSpinner';

export default function MovieDetails() {
  const { id } = useParams();
  const [movie,   setMovie]   = useState(null);
  const [fbData,  setFbData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReq, setShowReq] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMovie(null);
      setFbData(null);
      try {
        const [tmdbData, firebaseData] = await Promise.all([
          getMovieDetails(id),
          getEntry('movie', id),
        ]);
        setMovie(tmdbData);
        setFbData(firebaseData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <DetailsSkeleton />;
  if (!movie) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <FiAlertCircle size={48} className="text-white/30 mx-auto" />
        <p className="text-white/50">Movie not found.</p>
        <Link to="/" className="btn-brand inline-block">Go Home</Link>
      </div>
    </div>
  );

  const backdrop = backdropUrl(movie.backdrop_path, 'original');
  const poster   = posterUrl(movie.poster_path, 'w500');
  const runtime  = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;
  const year   = movie.release_date?.slice(0, 4);
  const cast   = movie.credits?.cast?.slice(0, 12) || [];
  const similar = [
    ...(movie.similar?.results       || []),
    ...(movie.recommendations?.results || []),
  ].slice(0, 12);
  const trailer = movie.videos?.results?.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  );
  const genres = movie.genres || [];

  const addedDate = fbData?.added_date?.toDate
    ? fbData.added_date.toDate().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : fbData?.added_date
      ? new Date(fbData.added_date).toLocaleDateString()
      : null;

  return (
    <div className="min-h-screen pb-16">

      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div className="relative h-[52vh] overflow-hidden">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            className="w-full h-full object-cover object-top"
          />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-950/50 to-dark-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/10 to-transparent" />
      </div>

      {/* ── Two-column panel ─────────────────────────────────────────────── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 -mt-52 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* ═══ LEFT COLUMN: Poster + quick stats ═══ */}
          <div className="flex-shrink-0 w-52 sm:w-60 lg:w-72 mx-auto lg:mx-0 lg:sticky lg:top-24">

            {/* Poster */}
            <div
              className="rounded-2xl overflow-hidden border border-white/10"
              style={{ boxShadow: '0 32px 64px -8px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)' }}
            >
              {poster ? (
                <img src={poster} alt={movie.title} className="w-full block" />
              ) : (
                <div className="aspect-[2/3] bg-dark-700 flex items-center justify-center text-6xl">
                  🎬
                </div>
              )}
            </div>

            {/* Quick stat pills */}
            <div className="mt-4 glass rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden">
              {movie.vote_average > 0 && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <FiStar size={14} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-semibold text-sm">
                      {movie.vote_average.toFixed(1)}
                    </span>
                    <span className="text-white/30 text-xs"> / 10</span>
                  </div>
                  <span className="text-white/25 text-xs font-mono">
                    {movie.vote_count?.toLocaleString()} votes
                  </span>
                </div>
              )}
              {year && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <FiCalendar size={14} className="text-brand-400 flex-shrink-0" />
                  <span className="text-white/70 text-sm">{year}</span>
                </div>
              )}
              {runtime && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <FiClock size={14} className="text-brand-400 flex-shrink-0" />
                  <span className="text-white/70 text-sm">{runtime}</span>
                </div>
              )}
              {movie.original_language && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <FiTag size={14} className="text-brand-400 flex-shrink-0" />
                  <span className="text-white/70 text-sm uppercase">
                    {movie.original_language}
                  </span>
                </div>
              )}
              {movie.status && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <FiFilm size={14} className="text-brand-400 flex-shrink-0" />
                  <span className="text-white/70 text-sm">{movie.status}</span>
                </div>
              )}
              {movie.budget > 0 && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <FiDollarSign size={14} className="text-brand-400 flex-shrink-0" />
                  <div>
                    <p className="text-white/30 text-xs font-mono">Budget</p>
                    <p className="text-white/70 text-sm">${(movie.budget / 1e6).toFixed(1)}M</p>
                  </div>
                </div>
              )}
              {movie.revenue > 0 && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <FiDollarSign size={14} className="text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-white/30 text-xs font-mono">Revenue</p>
                    <p className="text-white/70 text-sm">${(movie.revenue / 1e6).toFixed(1)}M</p>
                  </div>
                </div>
              )}
            </div>

            {/* Trailer button under stats */}
            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost glass border border-white/10 w-full justify-center mt-3 text-sm"
              >
                ▶ Watch Trailer
              </a>
            )}
          </div>

          {/* ═══ RIGHT COLUMN: All info ═══ */}
          <div className="flex-1 min-w-0 space-y-7 pt-0 lg:pt-6">

            {/* Title + tagline */}
            <div>
              <h1 className="font-display text-4xl sm:text-6xl text-white leading-none tracking-wide">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="text-white/40 font-body italic text-sm mt-2">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map(g => (
                  <span key={g.id} className="tag">{g.name}</span>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <div>
                <p className="text-xs text-white/30 font-mono uppercase tracking-widest mb-2">
                  Overview
                </p>
                <p className="text-white/75 font-body text-[0.92rem] leading-relaxed">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* ── Firebase custom data panel ─────────────────────────── */}
            {fbData ? (
              <div className="glass rounded-2xl p-5 space-y-4 border-l-4 border-brand-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 shadow shadow-green-400/60" />
                  <p className="text-xs text-brand-400 font-mono uppercase tracking-wider">
                    Available on CineLink
                  </p>
                </div>

                {addedDate && (
                  <div className="flex items-center gap-2 text-sm text-white/55">
                    <FiCalendar size={13} className="text-brand-400 flex-shrink-0" />
                    Added {addedDate}
                  </div>
                )}

                {fbData.note && (
                  <div className="flex items-start gap-2 text-sm text-white/70">
                    <FiMessageSquare size={13} className="text-brand-400 mt-0.5 flex-shrink-0" />
                    <span className="font-mono text-xs">{fbData.note}</span>
                  </div>
                )}

                {fbData.custom_link && (
                  <a
                    href={fbData.custom_link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn-brand inline-flex items-center gap-2 mt-1"
                  >
                    <FiPlay className="fill-white" size={14} />
                    Watch Now
                    <FiExternalLink size={12} />
                  </a>
                )}
              </div>
            ) : (
              /* Not available — request panel */
              <div className="glass rounded-2xl p-5 border border-dashed border-white/15
                              flex flex-col sm:flex-row items-start sm:items-center
                              justify-between gap-4">
                <div>
                  <p className="text-white/60 text-sm font-body font-medium">
                    Not yet available on CineLink
                  </p>
                  <p className="text-white/30 text-xs mt-0.5">
                    Request it and our team will add it as soon as possible.
                  </p>
                </div>
                <button
                  onClick={() => setShowReq(true)}
                  className="btn-brand text-sm flex-shrink-0"
                >
                  <FiMessageSquare size={13} />
                  Request Movie
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Cast ─────────────────────────────────────────────────────── */}
        {cast.length > 0 && (
          <section className="mt-16">
            <h2 className="section-title mb-6">
              <FiUsers className="inline mr-2 text-brand-400" size={20} />
              Cast
            </h2>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
              {cast.map(p => <CastCard key={p.id} person={p} />)}
            </div>
          </section>
        )}

        {/* ── Similar / Recommendations ─────────────────────────────────── */}
        {similar.length > 0 && (
          <section className="mt-16">
            <h2 className="section-title mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similar.map((item, i) => (
                <MovieCard
                  key={item.id}
                  item={{ ...item, media_type: 'movie' }}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Request modal */}
      {showReq && (
        <RequestModal item={movie} type="movie" onClose={() => setShowReq(false)} />
      )}
    </div>
  );
}
