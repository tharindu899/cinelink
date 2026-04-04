// src/pages/SeriesDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiStar, FiCalendar, FiExternalLink,
  FiMessageSquare, FiAlertCircle, FiDownload,
  FiTv, FiArrowLeft, FiHeart, FiPlay,
} from 'react-icons/fi';
import { getTVDetails, backdropUrl, posterUrl } from '../api/tmdb';
import { getEntry, getEpisodes } from '../firebase/firestore';
import CastCard from '../components/CastCard';
import MovieCard from '../components/MovieCard';
import RequestModal from '../components/RequestModal';
import { DetailsSkeleton } from '../components/LoadingSpinner';

// ── Helper: get quality→url map from fbData ───────────────────────────────────
function getQualityLinks(data) {
  if (!data) return null;
  if (data.links && typeof data.links === 'object') {
    const filtered = Object.fromEntries(Object.entries(data.links).filter(([, v]) => v));
    if (Object.keys(filtered).length > 0) return filtered;
  }
  if (data.custom_link) return { HD: data.custom_link };
  return null;
}

// ── Quality Download Button ────────────────────────────────────────────────────
function DownloadButton({ qualityLinks, size = 'sm' }) {
  const keys = Object.keys(qualityLinks);
  const [selected, setSelected] = useState(keys[0]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {keys.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {keys.map(q => (
            <button
              key={q}
              onClick={() => setSelected(q)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all duration-150 ${
                selected === q
                  ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/40'
                  : 'bg-dark-700/80 border-white/15 text-white/60 hover:text-white hover:border-white/30'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      )}
      <a
        href={qualityLinks[selected]}
        target="_blank"
        rel="noreferrer noopener"
        className="btn-brand text-sm"
      >
        <FiDownload size={13} />
        Download · {selected}
        <FiExternalLink size={11} />
      </a>
    </div>
  );
}

// ── Episode quality download (inline / compact) ───────────────────────────────
function EpisodeDownloadLinks({ qualityLinks }) {
  const keys = Object.keys(qualityLinks);
  const [selected, setSelected] = useState(keys[0]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {keys.length > 1 && keys.map(q => (
        <button
          key={q}
          onClick={() => setSelected(q)}
          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
            selected === q
              ? 'bg-brand-600 border-brand-500 text-white'
              : 'bg-dark-700 border-white/10 text-white/50 hover:text-white hover:border-white/30'
          }`}
        >
          {q}
        </button>
      ))}
      <a href={qualityLinks[selected]} target="_blank" rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
        <FiDownload size={10} /> Download <FiExternalLink size={9} />
      </a>
    </div>
  );
}

// ── Episode Card ──────────────────────────────────────────────────────────────
function EpisodeCard({ ep, onRequestEpisode }) {
  const label = `S${String(ep.season).padStart(2,'0')} E${String(ep.episode).padStart(2,'0')}`;
  const qualityLinks = getQualityLinks(ep);
  const hasLink = !!qualityLinks;

  return (
    <div className={`glass rounded-xl p-4 border transition-all duration-200 ${
      hasLink ? 'border-brand-500/30 hover:border-brand-500/60' : 'border-white/5 hover:border-white/10'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-semibold text-brand-400">{label}</span>
        <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${hasLink ? 'bg-green-400' : 'bg-white/20'}`} />
      </div>
      {ep.title && <p className="text-white text-sm font-body font-medium leading-snug mb-2 line-clamp-2">{ep.title}</p>}
      {ep.note  && <p className="text-white/40 text-xs font-mono mb-3 truncate">{ep.note}</p>}

      {hasLink ? (
        <EpisodeDownloadLinks qualityLinks={qualityLinks} />
      ) : (
        <button onClick={onRequestEpisode}
          className="inline-flex items-center gap-1.5 bg-dark-600 hover:bg-dark-500 text-white/60 hover:text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-all">
          <FiMessageSquare size={10} /> Request
        </button>
      )}
    </div>
  );
}

// ── Watchlist helper ──────────────────────────────────────────────────────────
function useWatchlist(id, type = 'series') {
  const key = `watchlist_${type}_${id}`;
  const [saved, setSaved] = useState(() => !!localStorage.getItem(key));
  const toggle = () => {
    if (saved) localStorage.removeItem(key);
    else localStorage.setItem(key, '1');
    setSaved(p => !p);
  };
  return [saved, toggle];
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SeriesDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show,       setShow]       = useState(null);
  const [fbData,     setFbData]     = useState(null);
  const [episodes,   setEpisodes]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showReq,    setShowReq]    = useState(false);
  const [reqEpisode, setReqEpisode] = useState(null);
  const [saved, toggleSaved]        = useWatchlist(id, 'series');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setShow(null); setFbData(null); setEpisodes([]);
      try {
        const [tmdbData, firebaseData, episodeData] = await Promise.all([
          getTVDetails(id),
          getEntry('series', id),
          getEpisodes(id),
        ]);
        setShow(tmdbData);
        setFbData(firebaseData);
        setEpisodes(episodeData);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
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
  const yearRange = firstAir ? (show.status === 'Ended' && lastAir !== firstAir ? `${firstAir}–${lastAir}` : firstAir) : null;
  const cast      = show.credits?.cast?.slice(0, 12) || [];
  const similar   = [...(show.similar?.results || []), ...(show.recommendations?.results || [])].slice(0, 12);
  const trailer   = show.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const genres    = show.genres || [];
  const creators  = show.created_by || [];
  const qualityLinks = getQualityLinks(fbData);

  const addedDate = fbData?.added_date?.toDate
    ? fbData.added_date.toDate().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    : null;

  const episodesBySeason = episodes.reduce((acc, ep) => {
    if (!acc[ep.season]) acc[ep.season] = [];
    acc[ep.season].push(ep);
    return acc;
  }, {});
  const seasonNumbers = Object.keys(episodesBySeason).map(Number).sort((a, b) => a - b);
  const availableCount = episodes.filter(e => getQualityLinks(e)).length;

  const handleEpisodeRequest = (ep) => { setReqEpisode({ season: ep.season, episode: ep.episode }); setShowReq(true); };
  const handleCloseReq = () => { setShowReq(false); setReqEpisode(null); };

  return (
    <div className="min-h-screen pb-16">

      {/* ── HERO ── */}
      <div className="relative">
        <div className="absolute inset-0 h-full min-h-[520px]">
          {backdrop && <img src={backdrop} alt="" className="w-full h-full object-cover object-top" />}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/85 to-dark-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950/70" />
        </div>

        <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 pt-28 pb-14">
          {/* Back */}
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-body mb-6 transition-colors group">
            <FiArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> Back
          </button>

          <div className="flex flex-row gap-7 sm:gap-10 items-start">
            {/* POSTER */}
            <div className="flex-shrink-0 w-28 sm:w-44 md:w-52 lg:w-60">
              <div className="rounded-2xl overflow-hidden border border-white/10" style={{ boxShadow: '0 24px 72px -8px rgba(0,0,0,0.95)' }}>
                {poster
                  ? <img src={poster} alt={show.name} className="w-full block" />
                  : <div className="aspect-[2/3] bg-dark-700 flex items-center justify-center text-4xl">📺</div>
                }
              </div>
            </div>

            {/* INFO */}
            <div className="flex-1 min-w-0 space-y-3 sm:space-y-4 pt-1 sm:pt-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="tag-brand text-xs">📺 SERIES</span>
                {(qualityLinks || episodes.length > 0) && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-green-900/40 text-green-400 border border-green-700/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Available
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white leading-[0.95] tracking-wide">
                {show.name}
              </h1>

              {show.tagline && (
                <p className="text-white/40 font-body italic text-xs sm:text-sm">&ldquo;{show.tagline}&rdquo;</p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {show.vote_average > 0 && (
                  <span className="rating-badge"><FiStar className="fill-amber-400" size={10} />{show.vote_average.toFixed(1)}</span>
                )}
                {yearRange && <span className="flex items-center gap-1 text-white/50 text-xs sm:text-sm"><FiCalendar size={11} /> {yearRange}</span>}
                {show.number_of_seasons > 0 && (
                  <span className="flex items-center gap-1 text-white/50 text-xs sm:text-sm">
                    <FiTv size={11} /> {show.number_of_seasons} Season{show.number_of_seasons > 1 ? 's' : ''}
                  </span>
                )}
                <span className={`tag text-xs ${show.status === 'Ended' ? 'bg-red-900/40 text-red-300' : 'bg-green-900/40 text-green-300'}`}>
                  {show.status}
                </span>
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {genres.map(g => <span key={g.id} className="tag text-xs">{g.name}</span>)}
                </div>
              )}

              {creators.length > 0 && (
                <p className="text-white/50 text-xs sm:text-sm font-body">
                  Created by <span className="text-white font-medium">{creators.map(c => c.name).join(', ')}</span>
                </p>
              )}

              {show.overview && (
                <p className="text-white/65 font-body text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-2xl">
                  {show.overview}
                </p>
              )}

                {trailer && (
                  <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer"
                    className="btn-ghost glass border border-white/15 text-sm">
                    <FiPlay size={12}/> Trailer
                  </a>
                )}

                <button
                  onClick={toggleSaved}
                  className={`btn-ghost p-2.5 rounded-xl border transition-all duration-200 ${
                    saved ? 'border-red-500/50 text-red-400 bg-red-900/20' : 'border-white/10 text-white/40 hover:text-white'
                  }`}
                  title={saved ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  <FiHeart size={16} className={saved ? 'fill-red-400' : ''} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 space-y-14 mt-10">

        {/* Availability panel */}
        {fbData && (qualityLinks || episodes.length > 0) && (
          <div className="glass rounded-2xl p-5 border-l-4 border-brand-500 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 shadow shadow-green-400/60" />
              <p className="text-xs text-brand-400 font-mono uppercase tracking-wider">Available on CineLink</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
              {addedDate && <span className="flex items-center gap-1.5"><FiCalendar size={12} className="text-brand-400" /> Added {addedDate}</span>}
              {fbData.note && <span className="flex items-center gap-1.5"><FiMessageSquare size={12} className="text-brand-400" /><span className="font-mono text-xs">{fbData.note}</span></span>}
              {episodes.length > 0 && <span className="flex items-center gap-1.5"><FiTv size={12} className="text-brand-400" /> {availableCount}/{episodes.length} episodes ready</span>}
            </div>
            {qualityLinks && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(qualityLinks).map(([q, url]) => (
                  <a key={q} href={url} target="_blank" rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors">
                    <FiDownload size={12} /> {q} <FiExternalLink size={10} className="opacity-60" />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Episodes section ── */}
        {episodes.length > 0 && (
          <section id="episodes-section">
            <div className="flex items-center justify-between mb-2">
              <h2 className="section-title">Watch Episodes</h2>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /> Available</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-white/20" /> Not available</span>
              </div>
            </div>
            <p className="text-white/35 text-sm font-body mb-8">
              {availableCount} of {episodes.length} episodes available
            </p>
            {seasonNumbers.map(season => (
              <div key={season} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <FiTv size={15} className="text-brand-400" />
                  <h3 className="font-display text-2xl text-white tracking-wide">Season {season}</h3>
                  <span className="text-white/25 text-xs font-mono">{episodesBySeason[season].length} ep{episodesBySeason[season].length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {episodesBySeason[season].map(ep => (
                    <EpisodeCard key={ep.id} ep={ep} onRequestEpisode={() => handleEpisodeRequest(ep)} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <section>
            <h2 className="section-title mb-6">Cast</h2>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
              {cast.map(p => <CastCard key={p.id} person={p} />)}
            </div>
          </section>
        )}

        {/* All seasons grid */}
        {show.seasons?.length > 0 && (
          <section>
            <h2 className="section-title mb-6">All Seasons</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {show.seasons.filter(s => s.season_number > 0).map(s => (
                <div key={s.id} className="glass rounded-xl p-3 text-center border border-white/5">
                  {s.poster_path
                    ? <img src={`https://image.tmdb.org/t/p/w185${s.poster_path}`} alt={s.name} className="w-full rounded-lg mb-2" />
                    : <div className="aspect-[2/3] bg-dark-700 rounded-lg mb-2 flex items-center justify-center text-2xl">📺</div>
                  }
                  <p className="text-white text-xs font-body font-semibold">S{s.season_number}</p>
                  <p className="text-white/40 text-xs">{s.episode_count} eps</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <section>
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
        <RequestModal item={show} type="series" season={reqEpisode?.season ?? null} episode={reqEpisode?.episode ?? null} onClose={handleCloseReq} />
      )}
    </div>
  );
}
