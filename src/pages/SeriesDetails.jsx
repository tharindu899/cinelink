// src/pages/SeriesDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiStar, FiCalendar, FiExternalLink,
  FiTag, FiMessageSquare, FiAlertCircle, FiPlay, FiTv
} from 'react-icons/fi';
import { getTVDetails, backdropUrl, posterUrl } from '../api/tmdb';
import { getEntry } from '../firebase/firestore';
import CastCard from '../components/CastCard';
import MovieCard from '../components/MovieCard';
import RequestModal from '../components/RequestModal';
import { DetailsSkeleton } from '../components/LoadingSpinner';

export default function SeriesDetails() {
  const { id } = useParams();
  const [show,    setShow]    = useState(null);
  const [fbData,  setFbData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReq, setShowReq] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setShow(null);
      setFbData(null);
      try {
        const [tmdbData, firebaseData] = await Promise.all([
          getTVDetails(id),
          getEntry('series', id),
        ]);
        setShow(tmdbData);
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
  if (!show) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <FiAlertCircle size={48} className="text-white/30 mx-auto" />
        <p className="text-white/50">Series not found.</p>
        <Link to="/" className="btn-brand inline-block">Go Home</Link>
      </div>
    </div>
  );

  const backdrop = backdropUrl(show.backdrop_path, 'original');
  const poster   = posterUrl(show.poster_path, 'w500');
  const firstAir = show.first_air_date?.slice(0, 4);
  const lastAir  = show.last_air_date?.slice(0, 4);
  const yearRange = firstAir
    ? show.status === 'Ended' && lastAir !== firstAir
      ? `${firstAir}–${lastAir}`
      : firstAir
    : null;
  const cast    = show.credits?.cast?.slice(0, 12) || [];
  const similar = [...(show.similar?.results || []), ...(show.recommendations?.results || [])].slice(0, 12);
  const trailer = show.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const genres  = show.genres || [];
  const creators = show.created_by || [];

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
                <img src={poster} alt={show.name} className="w-full" />
              ) : (
                <div className="aspect-[2/3] bg-dark-700 flex items-center justify-center text-5xl">📺</div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 space-y-5">
            {/* Title */}
            <div>
              <h1 className="font-display text-4xl sm:text-6xl text-white leading-none tracking-wide">
                {show.name}
              </h1>
              {show.tagline && (
                <p className="text-white/40 font-body italic text-sm mt-1">"{show.tagline}"</p>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {show.vote_average > 0 && (
                <span className="rating-badge text-sm">
                  <FiStar className="fill-amber-400" size={12} />
                  {show.vote_average.toFixed(1)}
                  <span className="text-amber-500/60 font-normal">/ 10</span>
                </span>
              )}
              {yearRange && (
                <span className="flex items-center gap-1.5 text-white/50">
                  <FiCalendar size={12} /> {yearRange}
                </span>
              )}
              {show.number_of_seasons > 0 && (
                <span className="flex items-center gap-1.5 text-white/50">
                  <FiTv size={12} />
                  {show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}
                </span>
              )}
              {show.number_of_episodes > 0 && (
                <span className="text-white/50">
                  {show.number_of_episodes} Episodes
                </span>
              )}
              <span className={`tag ${show.status === 'Ended' ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
                {show.status}
              </span>
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map(g => <span key={g.id} className="tag">{g.name}</span>)}
              </div>
            )}

            {/* Creators */}
            {creators.length > 0 && (
              <p className="text-white/50 text-sm font-body">
                Created by{' '}
                <span className="text-white font-medium">
                  {creators.map(c => c.name).join(', ')}
                </span>
              </p>
            )}

            {/* Overview */}
            {show.overview && (
              <p className="text-white/70 font-body text-sm leading-relaxed max-w-2xl">
                {show.overview}
              </p>
            )}

            {/* ── Firebase custom data ───────────────────────────────────── */}
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
                  <p className="text-white/60 text-sm font-body">No link available yet for this series.</p>
                  <p className="text-white/30 text-xs mt-0.5">Request it and our team will add it.</p>
                </div>
                <button
                  onClick={() => setShowReq(true)}
                  className="btn-brand text-sm flex-shrink-0"
                >
                  Request Series
                </button>
              </div>
            )}

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

        {/* Cast */}
        {cast.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">Cast</h2>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
              {cast.map(p => <CastCard key={p.id} person={p} />)}
            </div>
          </section>
        )}

        {/* Season grid */}
        {show.seasons?.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">Seasons</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {show.seasons.filter(s => s.season_number > 0).map(s => (
                <div key={s.id} className="glass rounded-xl p-3 text-center border border-white/5">
                  {s.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${s.poster_path}`}
                      alt={s.name}
                      className="w-full rounded-lg mb-2"
                    />
                  ) : (
                    <div className="aspect-[2/3] bg-dark-700 rounded-lg mb-2 flex items-center justify-center text-2xl">📺</div>
                  )}
                  <p className="text-white text-xs font-body font-semibold">S{s.season_number}</p>
                  <p className="text-white/40 text-xs">{s.episode_count} eps</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similar.map((item, i) => (
                <MovieCard key={item.id} item={{ ...item, media_type: 'tv' }} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {showReq && (
        <RequestModal item={show} type="series" onClose={() => setShowReq(false)} />
      )}
    </div>
  );
}
