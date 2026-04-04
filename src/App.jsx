// src/App.jsx
import { Routes, Route } from 'react-router-dom';
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
      <footer className="py-8 text-center text-white/30 text-xs font-body border-t border-white/5">
        <p>
          Powered by{' '}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noreferrer"
            className="text-brand-400 hover:text-brand-300 transition-colors"
          >
            TMDb
          </a>
          {' '}· Built with CineLink
        </p>
      </footer>
    </div>
  );
}
