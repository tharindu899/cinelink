// src/pages/SeriesDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiStar, FiCalendar, FiExternalLink,
  FiMessageSquare, FiAlertCircle, FiPlay, FiTv,
  FiLock, FiUnlock
} from 'react-icons/fi';
import { getTVDetails, backdropUrl, posterUrl } from '../api/tmdb';
import { getEntry, getEpisodes } from '../firebase/firestore';
import CastCard from '../components/CastCard';
import MovieCard from '../components/MovieCard';
import RequestModal from '../components/RequestModal';
import { DetailsSkeleton } from '../components/LoadingSpinner';

// ── Episode card shown in the "Watch Episodes" section ────────────────────────
function EpisodeCard({ ep, show, onRequestEpisode }) {
  const season  = ep.season;
  const episode = ep.episode;
  const label   = `S${String(season).padStart(2, '0')} E${String(episode).padStart(2, '0')}`;

  return (
    <div className={`glass rounded-xl p-4 border transition-all duration-200 ${
      ep.custom_link
        ? 'border-brand-500/30 hover:border-brand-500/60'
        : 'border-white/5 hover:border-white/10'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-semibold text-brand-400">{label}</span>
        {ep.custom_link ? (
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 flex-shrink-0" title="Available" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1 flex-shrink-0" title="Not available" />
        )}
      </div>

      {ep.title && (
        <p className="text-white text-sm font-body font-medium leading-snug mb-2 line-clamp-2">
          {ep.title}
        </p>
      )}

      {ep.note && (
        <p className="text-white/40 text-xs font-mono mb-3 truncate">{ep.note}</p>
      )}

      {ep.custom_link ? (
        <a
          href={ep.custom_link}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <FiPlay size={11} className="fill-white" />
          Watch
          <FiExternalLink size={10} />
        </a>
      ) : (
        <button
          onClick={onRequestEpisode}
          className="inline-flex items-center gap-1.5 bg-dark-600 hover:bg-dark-500 text-white/60 hover:text-white text-xs font-body font-medium px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all"
        >
          <FiMessageSquare size={10} />
          Request
        </button>
      )}
    </div>
  );
}

export default function SeriesDetails() {
  const { id } = useParams();
  const [show,     setShow]     = useState(null);
  const [fbData,   setFbData]   = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showReq,  setShowReq]  = useState(false);
  const [reqEpisode, setReqEpisode] = useState(null); // {season, episode} or null

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setShow(null);
      setFbData(null);
      setEpisodes([]);
      try {
        const [tmdbData, firebaseData, episodeData] = await Promise.all([
          getTVDetails(id),
          getEntry('series', id),
          getEpisodes(id),
        ]);
        setShow(tmdbData);
        setFbData(firebaseData);
        setEpisodes(episodeData);
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

  const backdrop  = backdropUrl(show.backdrop_path, 'original');
  const poster    = posterUrl(show.poster_path, 'w500');
  const firstAir  = show.first_air_date?.slice(0, 4);
  const lastAir   = show.last_air_date?.slice(0, 4);
  const yearRange = firstAir
    ? show.status === 'Ended' && lastAir !== firstAir ? `${firstAir}–${lastAir}` : firstAir
    : null;
  const cast     = show.credits?.cast?.slice(0, 12) || [];
  const similar  = [...(show.similar?.results || []), ...(show.recommendations?.results || [])].slice(0, 12);
  const trailer  = show.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const genres   = show.genres || [];
  const creators = show.created_by || [];

  const addedDate = fbData?.added_date?.toDate
    ? fbData.added_date.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : fbData?.added_date ? new Date(fbData.added_date).toLocaleDateString() : null;

  // Group episodes by season
  const episodesBySeason = episodes.reduce((acc, ep) => {
    if (!acc[ep.season]) acc[ep.season] = [];
    acc[ep.season].push(ep);
    return acc;
  }, {});
  const seasonNumbers = Object.keys(episodesBySeason).map(Number).sort((a, b) => a - b);

  const handleEpisodeRequest = (ep) => {
    setReqEpisode({ season: ep.season, episode: ep.episode });
    setShowReq(true);
  };

  const handleCloseReq = () => {
    setShowReq(false);
    setReqEpisode(null);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Backdrop */}
      <div className="relative h-[55vh] overflow-hidden">
        {backdrop && <img src={backdrop} alt="" className="w-full h-full object-cover object-top" />}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/70 to-dark-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />
      </div>

      {/* Details panel */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 -mt-48 relative z-10">
        <div className="flex flex-col sm:flex-row gap-8">

          {/* Poster */}
          <div className="flex-shrink-0 w-44 sm:w-56 mx-auto sm:mx-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10">
              {poster
                ? <img src={poster} alt={show.name} className="w-full" />
                : <div className="aspect-[2/3] bg-dark-700 flex items-center justify-center text-5xl">📺</div>
              }
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-2 space-y-5">
            <div>
              <h1 className="font-display text-4xl sm:text-6xl text-white leading-none tracking-wide">
                {show.name}
              </h1>
              {show.tagline && (
                <p className="text-white/40 font-body italic text-sm mt-1">"{show.tagline}"</p>
              )}
            </div>

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
                <span className="text-white/50">{show.number_of_episodes} Episodes</span>
              )}
              <span className={`tag ${show.status === 'Ended' ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
                {show.status}
              </span>
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map(g => <span key={g.id} className="tag">{g.name}</span>)}
              </div>
            )}

            {creators.length > 0 && (
              <p className="text-white/50 text-sm font-body">
                Created by{' '}
                <span className="text-white font-medium">{creators.map(c => c.name).join(', ')}</span>
              </p>
            )}

            {show.overview && (
              <p className="text-white/70 font-body text-sm leading-relaxed max-w-2xl">{show.overview}</p>
            )}

            {/* ── Firebase custom data ── */}
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
                    Watch Full Series
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
                  onClick={() => { setReqEpisode(null); setShowReq(true); }}
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

        {/* ── Episodes section ── */}
        {episodes.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-2">
              <h2 className="section-title">Watch Episodes</h2>
              <div className="flex items-center gap-3 text-xs text-white/40 font-body">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white/20 inline-block" /> Not available
                </span>
              </div>
            </div>
            <p className="text-white/40 text-sm font-body mb-8">
              {episodes.filter(e => e.custom_link).length} of {episodes.length} episodes available
            </p>

            {seasonNumbers.map(season => (
              <div key={season} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <FiTv size={15} className="text-brand-400" />
                  <h3 className="font-display text-2xl text-white tracking-wide">Season {season}</h3>
                  <span className="text-white/30 text-xs font-mono">
                    {episodesBySeason[season].length} episode{episodesBySeason[season].length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {episodesBySeason[season].map(ep => (
                    <EpisodeCard
                      key={ep.id}
                      ep={ep}
                      show={show}
                      onRequestEpisode={() => handleEpisodeRequest(ep)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Cast ── */}
        {cast.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">Cast</h2>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
              {cast.map(p => <CastCard key={p.id} person={p} />)}
            </div>
          </section>
        )}

        {/* ── Seasons grid (TMDb) ── */}
        {show.seasons?.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-6">All Seasons</h2>
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

        {/* ── Similar ── */}
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

      {/* Request modal — series or specific episode */}
      {showReq && (
        <RequestModal
          item={show}
          type="series"
          season={reqEpisode?.season ?? null}
          episode={reqEpisode?.episode ?? null}
          onClose={handleCloseReq}
        />
      )}
    </div>
  );
}
