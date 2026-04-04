// src/pages/MovieDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiStar, FiClock, FiCalendar, FiExternalLink,
  FiTag, FiMessageSquare, FiAlertCircle, FiPlay
} from 'react-icons/fi';
import { getMovieDetails, backdropUrl, posterUrl } from '../api/tmdb';
import { getEntry } from '../firebase/firestore';
import CastCard from '../components/CastCard';
import MovieCard from '../components/MovieCard';
import RequestModal from '../components/RequestModal';
import { DetailsSkeleton } from '../components/LoadingSpinner';

export default function MovieDetails() {
  const { id } = useParams();
  const [movie,    setMovie]    = useState(null);
  const [fbData,   setFbData]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showReq,  setShowReq]  = useState(false);

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
  if (!movie)  return (
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
  const runtime  = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const year     = movie.release_date?.slice(0, 4);
  const cast     = movie.credits?.cast?.slice(0, 12) || [];
  const similar  = [...(movie.similar?.results || []), ...(movie.recommendations?.results || [])].slice(0, 12);
  const trailer  = movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const genres   = movie.genres || [];

  // Format Firebase added_date
  const addedDate = fbData?.added_date?.toDate
    ? fbData.added_date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : fbData?.added_date
      ? new Date(fbData.added_date).toLocaleDateString()
      : null;

  return (
    <div className="min-h-screen pb-16">
      {/* Backdrop */}
      <div className="relative h-[55vh] overflow-hidden">
        {backdrop && (
          <img src={backdrop} alt="" className="w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/70 to-dark-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />
      </div>

      {/* Details panel */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 -mt-48 relative z-10">
        <div className="flex flex-col sm:flex-row gap-8">

          {/* Poster */}
          <div className="flex-shrink-0 w-44 sm:w-56 mx-auto sm:mx-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10">
              {poster ? (
                <img src={poster} alt={movie.title} className="w-full" />
              ) : (
                <div className="aspect-[2/3] bg-dark-700 flex items-center justify-center text-5xl">🎬</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 space-y-5">
            {/* Title */}
            <div>
              <h1 className="font-display text-4xl sm:text-6xl text-white leading-none tracking-wide">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="text-white/40 font-body italic text-sm mt-1">"{movie.tagline}"</p>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {movie.vote_average > 0 && (
                <span className="rating-badge text-sm">
                  <FiStar className="fill-amber-400" size={12} />
                  {movie.vote_average.toFixed(1)}
                  <span className="text-amber-500/60 font-normal">/ 10</span>
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1.5 text-white/50">
                  <FiCalendar size={12} /> {year}
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1.5 text-white/50">
                  <FiClock size={12} /> {runtime}
                </span>
              )}
              {movie.original_language && (
                <span className="tag uppercase">{movie.original_language}</span>
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
              <p className="text-white/70 font-body text-sm leading-relaxed max-w-2xl">
                {movie.overview}
              </p>
            )}

            {/* ── Firebase custom data panel ────────────────────────────── */}
            {fbData ? (
              <div className="glass rounded-2xl p-4 space-y-3 border-l-4 border-brand-500">
                <p className="text-xs text-brand-400 font-mono uppercase tracking-wider">Available on CineLink</p>

                {addedDate && (
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <FiCalendar size={13} className="text-brand-400" />
                    Added {addedDate}
                  </div>
                )}

                {fbData.note && (
                  <div className="flex items-start gap-2 text-sm text-white/70">
                    <FiMessageSquare size={13} className="text-brand-400 mt-0.5" />
                    <span>{fbData.note}</span>
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
              <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-white/60 text-sm font-body">No link available yet for this title.</p>
                  <p className="text-white/30 text-xs mt-0.5">Request it and our team will add it.</p>
                </div>
                <button
                  onClick={() => setShowReq(true)}
                  className="btn-brand text-sm flex-shrink-0"
                >
                  Request Movie
                </button>
              </div>
            )}

            {/* Trailer button */}
            {trailer && (
              <a
                href={`https://www.youtube.com/watch?v=${trailer.key}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost glass border border-white/10 inline-flex"
              >
                ▶ Watch Trailer
              </a>
            )}
          </div>
        </div>

        {/* ── Cast ────────────────────────────────────────────────────────── */}
        {cast.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">Cast</h2>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
              {cast.map(p => <CastCard key={p.id} person={p} />)}
            </div>
          </section>
        )}

        {/* ── Additional info ──────────────────────────────────────────────── */}
        <section className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Status',         value: movie.status },
            { label: 'Budget',         value: movie.budget > 0 ? `$${(movie.budget / 1e6).toFixed(1)}M` : null },
            { label: 'Revenue',        value: movie.revenue > 0 ? `$${(movie.revenue / 1e6).toFixed(1)}M` : null },
            { label: 'Vote Count',     value: movie.vote_count?.toLocaleString() },
          ].filter(i => i.value).map(item => (
            <div key={item.label} className="glass rounded-xl p-4">
              <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-white font-body font-semibold text-sm">{item.value}</p>
            </div>
          ))}
        </section>

        {/* ── Similar ─────────────────────────────────────────────────────── */}
        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similar.map((item, i) => (
                <MovieCard key={item.id} item={{ ...item, media_type: 'movie' }} index={i} />
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
