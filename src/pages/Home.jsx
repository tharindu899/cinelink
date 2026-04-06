// src/pages/Home.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FiDownload, FiSearch, FiChevronLeft, FiChevronRight,
  FiMessageSquare, FiX,
} from 'react-icons/fi';
import HeroSection from '../components/HeroSection';
import MediaRow from '../components/MediaRow';
import {
  getPopularMovies, getPopularTV, getTrending,
  getTopRatedMovies, getNowPlaying,
} from '../api/tmdb';
import { listenEntries } from '../firebase/firestore';

const QUALITY_ORDER = ['4K', '1080p', '720p', '480p', '360p'];

// ── Available‑on‑CineLink card ────────────────────────────────────────────────
function AvailableCard({ entry, index = 0 }) {
  const isMovie = entry.type === 'movie';
  const title   = entry.title || entry.name || 'Untitled';
  const poster  = entry.poster_path ? `https://image.tmdb.org/t/p/w342${entry.poster_path}` : null;
  const path    = isMovie ? `/movie/${entry.id}` : `/series/${entry.id}`;

  const linkCount = entry.links
    ? Object.values(entry.links).filter(Boolean).length
    : entry.custom_link ? 1 : 0;

  // "New" = added within last 7 days
  const isNew = entry.added_date?.toDate
    ? (Date.now() - entry.added_date.toDate().getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  const hasSubtitles = entry.subtitles && Object.values(entry.subtitles).some(Boolean);

  return (
    <Link
      to={path}
      className="group relative flex-shrink-0 w-36 sm:w-44 rounded-2xl overflow-hidden
                 bg-dark-800 border border-brand-500/25
                 hover:border-brand-500/70 hover:shadow-2xl hover:shadow-brand-900/40
                 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-dark-700">
        {poster ? (
          <img src={poster} alt={title} loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {isMovie ? '🎬' : '📺'}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent" />

        {/* Type + NEW badges — top left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isNew && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold
                             bg-green-500 text-white shadow-lg shadow-green-900/60 tracking-wider">
              NEW
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold
                           bg-dark-900/80 text-white/60 border border-white/10">
            {isMovie ? 'MOVIE' : 'SERIES'}
          </span>
        </div>

        {/* Quality count badge — top right */}
        {linkCount > 1 && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold
                             bg-brand-900/80 text-brand-300 border border-brand-700/50">
              {linkCount} Q
            </span>
          </div>
        )}

        {/* Subtitle indicator — bottom right (small dot) */}
        {hasSubtitles && (
          <div className="absolute bottom-10 right-2">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold
                             bg-blue-900/80 text-blue-300 border border-blue-700/50">
              SUB
            </span>
          </div>
        )}

        {/* Download pill on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-2
                        translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <span className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl
                           bg-brand-600/95 text-white text-xs font-semibold backdrop-blur-sm shadow-lg">
            <FiDownload size={10} /> Download
          </span>
        </div>

        {/* Green availability dot */}
        <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full
                        bg-green-400 shadow shadow-green-400/60" />
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <h3 className="font-body font-semibold text-sm text-white line-clamp-2 leading-snug
                       group-hover:text-brand-300 transition-colors">
          {title}
        </h3>
        {entry.note && (
          <p className="text-xs text-brand-400/70 font-mono truncate">{entry.note}</p>
        )}
      </div>
    </Link>
  );
}

// ── Available section with filter + scroll arrows ─────────────────────────────
function AvailableRow({ movies, series }) {
  const rowRef = useRef(null);

  const [filterType,    setFilterType]    = useState('all');
  const [filterQuality, setFilterQuality] = useState('all');

  const combined = useMemo(() => {
    const all = [...movies, ...series].sort((a, b) => {
      const aT = a.added_date?.seconds ?? 0;
      const bT = b.added_date?.seconds ?? 0;
      return bT - aT;
    });
    return all;
  }, [movies, series]);

  // Compute which qualities actually exist across the list (preserving standard order)
  const availableQualities = useMemo(() => {
    const qs = new Set();
    combined.forEach(e => {
      if (e.links) Object.keys(e.links).forEach(q => e.links[q] && qs.add(q));
    });
    return QUALITY_ORDER.filter(q => qs.has(q));
  }, [combined]);

  const filtered = useMemo(() => {
    return combined.filter(e => {
      if (filterType !== 'all' && e.type !== filterType) return false;
      if (filterQuality !== 'all') {
        if (!e.links || !e.links[filterQuality]) return false;
      }
      return true;
    });
  }, [combined, filterType, filterQuality]);

  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });

  const hasActiveFilter = filterType !== 'all' || filterQuality !== 'all';
  const clearFilters = () => { setFilterType('all'); setFilterQuality('all'); };

  if (combined.length === 0) return null;

  return (
    <section className="relative">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="section-title flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse
                             shadow shadow-green-400/60 inline-block" />
            Available on CineLink
          </h2>
          <p className="text-white/35 text-xs font-body mt-1 ml-[22px]">
            {hasActiveFilter
              ? `${filtered.length} of ${combined.length} title${combined.length !== 1 ? 's' : ''}`
              : `${combined.length} title${combined.length !== 1 ? 's' : ''} ready to download`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/search"
            className="text-xs text-brand-400 hover:text-brand-300 font-body font-medium
                       flex items-center gap-1 transition-colors mr-1">
            <FiSearch size={11} /> Browse all
          </Link>
          <button onClick={() => scroll(-1)}
            className="btn-ghost p-1.5 rounded-lg hidden sm:flex"><FiChevronLeft size={16} /></button>
          <button onClick={() => scroll(1)}
            className="btn-ghost p-1.5 rounded-lg hidden sm:flex"><FiChevronRight size={16} /></button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4 ml-[22px]">
        {/* Type chips */}
        {[
          { key: 'all',    label: 'All' },
          { key: 'movie',  label: '🎬 Movies' },
          { key: 'series', label: '📺 Series' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilterType(key)}
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all duration-150 ${
              filterType === key
                ? 'bg-brand-600 border-brand-500 text-white shadow shadow-brand-900/40'
                : 'bg-dark-800 border-white/10 text-white/40 hover:text-white hover:border-white/30'
            }`}
          >
            {label}
          </button>
        ))}

        {/* Divider */}
        {availableQualities.length > 0 && (
          <span className="w-px h-4 bg-white/10 mx-0.5" />
        )}

        {/* Quality chips — only show qualities that exist in list */}
        {availableQualities.map(q => (
          <button
            key={q}
            onClick={() => setFilterQuality(filterQuality === q ? 'all' : q)}
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border transition-all duration-150 ${
              filterQuality === q
                ? 'bg-dark-600 border-white/40 text-white shadow shadow-black/30'
                : 'bg-dark-800 border-white/10 text-white/40 hover:text-white hover:border-white/30'
            }`}
          >
            {q}
          </button>
        ))}

        {/* Clear filter */}
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono
                       font-semibold text-white/40 hover:text-white border border-white/10
                       hover:border-white/30 transition-all duration-150"
          >
            <FiX size={10} /> Clear
          </button>
        )}
      </div>

      {/* Scrollable row */}
      {filtered.length > 0 ? (
        <div ref={rowRef}
          className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          {filtered.map((entry, i) => (
            <AvailableCard
              key={`${entry.type}-${entry.id}`}
              entry={entry}
              index={i}
            />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl px-6 py-8 text-center border border-white/5">
          <p className="text-white/40 text-sm font-body">No titles match this filter.</p>
          <button
            onClick={clearFilters}
            className="text-brand-400 hover:text-brand-300 text-xs font-mono mt-2
                       transition-colors inline-block"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}

function EmptyAvailableBanner() {
  return (
    <div className="glass rounded-2xl border border-white/5 px-6 py-8
                    flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
      <div className="text-4xl">🎬</div>
      <div className="flex-1">
        <p className="text-white font-body font-semibold text-sm">No titles available yet</p>
        <p className="text-white/40 text-xs mt-0.5">
          Can't find something to watch? Request it and it'll be added.
        </p>
      </div>
      <Link to="/search" className="btn-brand text-sm flex-shrink-0">
        <FiMessageSquare size={13} /> Find & Request
      </Link>
    </div>
  );
}

export default function Home() {
  const [trending,   setTrending]   = useState([]);
  const [popular,    setPopular]    = useState([]);
  const [popularTV,  setPopularTV]  = useState([]);
  const [topRated,   setTopRated]   = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fbMovies,   setFbMovies]   = useState([]);
  const [fbSeries,   setFbSeries]   = useState([]);

  useEffect(() => {
    const unsubM = listenEntries('movie',  setFbMovies);
    const unsubS = listenEntries('series', setFbSeries);
    return () => { unsubM(); unsubS(); };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [t, m, tv, tr, np] = await Promise.all([
          getTrending('all', 'day'),
          getPopularMovies(),
          getPopularTV(),
          getTopRatedMovies(),
          getNowPlaying(),
        ]);
        setTrending(t.results    || []);
        setPopular(m.results     || []);
        setPopularTV(tv.results  || []);
        setTopRated(tr.results   || []);
        setNowPlaying(np.results || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const hasAvailable = fbMovies.length > 0 || fbSeries.length > 0;

  return (
    <div className="min-h-screen">
      <HeroSection />
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 space-y-14">

        <section>
          {hasAvailable
            ? <AvailableRow movies={fbMovies} series={fbSeries} />
            : <EmptyAvailableBanner />
          }
        </section>

        <MediaRow title="🔥 Trending Today"  items={trending}   loading={loading} viewAllHref="/search?tab=trending" />
        <MediaRow title="🎬 Popular Movies"  items={popular}    loading={loading} viewAllHref="/search?tab=movies" />
        <MediaRow title="📺 Popular Series"  items={popularTV}  loading={loading} viewAllHref="/search?tab=series" />
        <MediaRow title="🏆 Top Rated"       items={topRated}   loading={loading} viewAllHref="/search?tab=top-rated" />
        <MediaRow title="🎭 Now Playing"     items={nowPlaying} loading={loading} />
      </div>
    </div>
  );
}
