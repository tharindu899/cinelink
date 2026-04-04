// src/pages/Search.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch, FiFilter } from 'react-icons/fi';
import MovieCard from '../components/MovieCard';
import { CardSkeleton } from '../components/LoadingSpinner';
import { searchMulti, searchMovies, searchTV, getPopularMovies, getPopularTV, getTrending, getTopRatedMovies } from '../api/tmdb';

const TABS = [
  { key: 'all',       label: 'All'        },
  { key: 'movies',    label: 'Movies'     },
  { key: 'series',    label: 'Series'     },
  { key: 'trending',  label: 'Trending'   },
  { key: 'top-rated', label: 'Top Rated'  },
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ   = searchParams.get('q')   || '';
  const initialTab = searchParams.get('tab') || 'all';

  const [query,   setQuery]   = useState(initialQ);
  const [tab,     setTab]     = useState(initialTab);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page,    setPage]    = useState(1);
  const [total,   setTotal]   = useState(0);
  const inputRef = useRef(null);

  const fetchResults = useCallback(async (q, t, p = 1) => {
    setLoading(true);
    try {
      let data;
      if (q) {
        if (t === 'movies')       data = await searchMovies(q, p);
        else if (t === 'series')  data = await searchTV(q, p);
        else                      data = await searchMulti(q, p);
      } else {
        if (t === 'series')       data = await getPopularTV(p);
        else if (t === 'trending')data = await getTrending('all', 'week');
        else if (t === 'top-rated')data = await getTopRatedMovies(p);
        else                      data = await getPopularMovies(p);
      }

      const items = (data.results || []).filter(r =>
        r.media_type !== 'person' &&
        (r.poster_path || r.backdrop_path)
      );

      setResults(prev => p === 1 ? items : [...prev, ...items]);
      setTotal(data.total_results || items.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount + when query/tab changes
  useEffect(() => {
    setPage(1);
    setResults([]);
    fetchResults(query, tab, 1);
    setSearchParams(q => {
      const next = new URLSearchParams(q);
      if (query) next.set('q', query); else next.delete('q');
      next.set('tab', tab);
      return next;
    });
  }, [query, tab]); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim() || '';
    setQuery(q);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchResults(query, tab, nextPage);
  };

  const hasMore = results.length < total && total > 0;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 max-w-screen-xl mx-auto">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative max-w-2xl">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-lg" />
          <input
            ref={inputRef}
            type="text"
            defaultValue={initialQ}
            placeholder="Search for movies, TV series…"
            className="input-dark pl-12 pr-24 py-4 text-base rounded-2xl"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn-brand py-2 px-4 text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-body font-medium transition-all duration-200 ${
              tab === t.key
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/40'
                : 'bg-dark-700 text-white/60 hover:text-white hover:bg-dark-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-white/40 text-sm font-body">
          {query ? (
            <>Results for <span className="text-white font-semibold">"{query}"</span></>
          ) : (
            <span className="capitalize">{tab.replace('-', ' ')}</span>
          )}
          {!loading && total > 0 && (
            <span className="ml-2 text-white/30">· {total.toLocaleString()} found</span>
          )}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {results.map((item, i) => (
          <MovieCard key={`${item.id}-${i}`} item={item} index={i} />
        ))}
        {loading && Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={`sk-${i}`} />)}
      </div>

      {/* Empty state */}
      {!loading && results.length === 0 && (
        <div className="text-center py-20 space-y-3">
          <div className="text-6xl">🔍</div>
          <p className="text-white/40 font-body">No results found{query ? ` for "${query}"` : ''}.</p>
          <p className="text-white/25 text-sm">Try a different search term.</p>
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="text-center mt-10">
          <button onClick={loadMore} className="btn-ghost glass px-8 py-3 border border-white/10">
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
