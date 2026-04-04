// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';
import { FiHome, FiSearch } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-5">
        <p className="font-display text-[10rem] leading-none text-brand-600/30 select-none">404</p>
        <div className="space-y-2 -mt-8">
          <h1 className="font-display text-4xl text-white tracking-wide">Page Not Found</h1>
          <p className="text-white/40 font-body">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/" className="btn-brand">
            <FiHome size={14} /> Go Home
          </Link>
          <Link to="/search" className="btn-ghost glass border border-white/10">
            <FiSearch size={14} /> Search
          </Link>
        </div>
      </div>
    </div>
  );
}
