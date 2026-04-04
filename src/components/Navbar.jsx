// src/components/Navbar.jsx
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiFilm, FiLogOut, FiSettings, FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [query,      setQuery]      = useState('');
  const [scroll,     setScroll]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = () => setScroll(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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

          {/* ── Search bar — always visible ── */}
          <form onSubmit={handleSearch} className="flex-1 max-w-lg">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search movies & series…"
                className="w-full pl-9 pr-4 py-2 rounded-xl
                           bg-white/10 border border-white/10
                           text-white text-sm placeholder-white/30
                           focus:outline-none focus:bg-white/15 focus:border-brand-500/50
                           transition-all duration-200"
              />
            </div>
          </form>

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

      {/* Mobile dropdown — links only (no search, it's in the bar above) */}
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
