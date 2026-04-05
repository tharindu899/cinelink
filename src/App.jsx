// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import { FiGithub, FiHeart } from 'react-icons/fi';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Search from './pages/Search';
import MovieDetails from './pages/MovieDetails';
import SeriesDetails from './pages/SeriesDetails';
import PersonDetails from './pages/PersonDetails';
import Admin from './pages/Admin';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-dark-950">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/search"      element={<Search />} />
          <Route path="/movie/:id"   element={<MovieDetails />} />
          <Route path="/series/:id"  element={<SeriesDetails />} />
          <Route path="/person/:id"  element={<PersonDetails />} />
          <Route path="/login"       element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 bg-dark-900/60 backdrop-blur-md">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

            {/* Left — branding */}
            <div className="flex items-center gap-2 text-white/25 text-xs font-body">
              <span>Powered by</span>
              <a
                href="https://www.themoviedb.org"
                target="_blank"
                rel="noreferrer"
                className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
              >
                TMDb
              </a>
              <span className="text-white/10">·</span>
              <span>Built with</span>
              <span className="text-white/40 font-semibold font-display tracking-wide text-sm">
                CINE<span className="text-brand-500">LINK</span>
              </span>
            </div>

            {/* Center — made with love */}
            <div className="flex items-center gap-1.5 text-white/20 text-xs font-body order-last sm:order-none">
              <span>Made with</span>
              <FiHeart size={11} className="text-brand-500 fill-brand-500" />
              <span>by</span>
              <a
                href="https://github.com/tharindu899"
                target="_blank"
                rel="noreferrer"
                className="text-white/40 hover:text-white font-semibold transition-colors"
              >
                Tharindu
              </a>
            </div>

            {/* Right — GitHub button */}
            <a
              href="https://github.com/tharindu899/cinelink"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg
                         bg-white/5 hover:bg-white/10
                         border border-white/8 hover:border-white/20
                         text-white/40 hover:text-white
                         text-xs font-body font-medium
                         transition-all duration-200"
            >
              <FiGithub size={14} className="group-hover:rotate-12 transition-transform duration-200" />
              <span>Source Code</span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow shadow-green-400/60" />
            </a>

          </div>
        </div>
      </footer>
    </div>
  );
}
