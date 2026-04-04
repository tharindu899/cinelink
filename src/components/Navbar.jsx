// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiFilm, FiLogOut, FiSettings, FiMenu, FiX, FiTv, FiLoader } from 'react-icons/fi';
import { searchMulti, posterUrl } from '../api/tmdb';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [query,        setQuery]        = useState('');
  const [scroll,       setScroll]       = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropResults,  setDropResults]  = useState([]);
  const [dropLoading,  setDropLoading]  = useState(false);
  const [showDrop,     setShowDrop]     = useState(false);
  const inputRef   = useRef(null);
  const wrapperRef = useRef(null);
  const timerRef   = useRef(null);

  useEffect(() => {
    const handler = () => setScroll(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); setShowDrop(false); }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced live search
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) {
      setDropResults([]);
      setShowDrop(false);
      return;
    }
    setDropLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await searchMulti(query.trim());
        const items = (data.results || [])
          .filter(r => r.media_type !== 'person' && (r.poster_path || r.backdrop_path))
          .slice(0, 6);
        setDropResults(items);
        setShowDrop(true);
      } catch {
        setDropResults([]);
      } finally {
        setDropLoading(false);
      }
    }, 300);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setShowDrop(false); inputRef.current?.blur(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = query.trim();
      if (q) {
        setShowDrop(false);
        setQuery('');
        navigate(`/search?q=${encodeURIComponent(q)}`);
      }
    }
  };

  const handleResultClick = (item) => {
    const isMovie = item.media_type === 'movie' || item.title !== undefined;
    const path = isMovie ? `/movie/${item.id}` : `/series/${item.id}`;
    setQuery('');
    setShowDrop(false);
    navigate(path);
  };

  const handleLogout = async () => { await logout(); navigate('/'); };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scroll
          ? 'bg-dark-900/95 backdrop-blur-md border-b border-white/5 shadow-xl shadow-black/30'
          : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-900/50 group-hover:bg-brand-500 transition-colors">
              <FiFilm className="text-white text-lg" />
            </div>
            <span className="font-display text-2xl text-white tracking-wide hidden sm:block">
              CINE<span className="text-brand-400">LINK</span>
            </span>
          </Link>

          {/* Search + Dropdown wrapper */}
          <div ref={wrapperRef} className="flex-1 max-w-lg relative">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => dropResults.length > 0 && setShowDrop(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search movies & series…"
                className="w-full pl-9 pr-4 py-2 rounded-xl
                           bg-white/10 border border-white/10
                           text-white text-sm placeholder-white/30
                           focus:outline-none focus:bg-white/15 focus:border-brand-500/50
                           transition-all duration-200"
              />
              {dropLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-brand-400 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Dropdown */}
            {showDrop && dropResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 z-50 glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60">
                {dropResults.map((item, i) => {
                  const isMovie = item.media_type === 'movie' || item.title !== undefined;
                  const title   = item.title || item.name;
                  const year    = (item.release_date || item.first_air_date || '').slice(0, 4);
                  const poster  = posterUrl(item.poster_path, 'w92');
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleResultClick(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/8 transition-colors text-left border-b border-white/5 last:border-0 group"
                    >
                      {/* Poster thumbnail */}
                      <div className="flex-shrink-0 w-8 h-12 rounded overflow-hidden bg-dark-700">
                        {poster
                          ? <img src={poster} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">{isMovie ? '🎬' : '📺'}</div>
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-body font-semibold truncate group-hover:text-brand-300 transition-colors">
                          {title}
                        </p>
                        <p className="text-white/40 text-xs">{year}</p>
                      </div>

                      {/* Type badge */}
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-md font-mono font-semibold
                        ${isMovie
                          ? 'bg-brand-900/50 text-brand-400 border border-brand-800/50'
                          : 'bg-blue-900/50 text-blue-400 border border-blue-800/50'
                        }`}
                      >
                        {isMovie ? 'MOVIE' : 'SERIES'}
                      </span>
                    </button>
                  );
                })}

                {/* "See all results" footer */}
                <button
                  onClick={() => { setShowDrop(false); navigate(`/search?q=${encodeURIComponent(query)}`); setQuery(''); }}
                  className="w-full py-3 text-center text-xs text-brand-400 hover:text-brand-300 font-body font-medium transition-colors bg-dark-800/50 hover:bg-dark-700/50"
                >
                  See all results for "{query}" →
                </button>
              </div>
            )}
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-shrink-0">
            <Link to="/search?tab=movies" className="btn-ghost text-sm">Movies</Link>
            <Link to="/search?tab=series" className="btn-ghost text-sm">Series</Link>
            {isAdmin && (
              <Link to="/admin" className="btn-ghost text-sm">
                <FiSettings className="text-brand-400" />
                Admin
              </Link>
            )}
            {user ? (
              <button onClick={handleLogout} className="btn-ghost text-sm">
                <FiLogOut /> Logout
              </button>
            ) : (
              <Link to="/login" className="btn-brand text-sm py-2 px-4">Login</Link>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden btn-ghost p-2 flex-shrink-0"
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        } bg-dark-900/98 backdrop-blur-md border-b border-white/5`}
      >
        <div className="px-4 py-4 space-y-2">
          <Link to="/search?tab=movies" className="block btn-ghost w-full">Movies</Link>
          <Link to="/search?tab=series" className="block btn-ghost w-full">Series</Link>
          {isAdmin && (
            <Link to="/admin" className="block btn-ghost w-full">
              <FiSettings className="text-brand-400" /> Admin
            </Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="block btn-ghost w-full text-left">
              <FiLogOut /> Logout
            </button>
          ) : (
            <Link to="/login" className="block btn-brand w-full text-center">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
