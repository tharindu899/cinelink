// src/components/HeroSection.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlay, FiInfo, FiStar } from 'react-icons/fi';
import { getTrending, backdropUrl, posterUrl } from '../api/tmdb';

export default function HeroSection() {
  const [items,   setItems]   = useState([]);
  const [current, setCurrent] = useState(0);
  const [fade,    setFade]    = useState(true);

  useEffect(() => {
    getTrending('all', 'week')
      .then(d => setItems(d.results?.slice(0, 5) || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(c => (c + 1) % items.length);
        setFade(true);
      }, 400);
    }, 7000);
    return () => clearInterval(timer);
  }, [items]);

  if (!items.length) {
    return <div className="h-[65vh] bg-dark-900 animate-pulse" />;
  }

  const item    = items[current];
  const isMovie = item.media_type === 'movie' || item.title !== undefined;
  const title   = item.title || item.name;
  const year    = (item.release_date || item.first_air_date || '').slice(0, 4);
  const path    = isMovie ? `/movie/${item.id}` : `/series/${item.id}`;
  const backdrop = backdropUrl(item.backdrop_path, 'original');

  return (
    <div className="relative h-[70vh] min-h-[520px] overflow-hidden">
      {/* Background */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}
      >
        {backdrop ? (
          <img
            src={backdrop}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-dark-800" />
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950/30" />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 h-full flex flex-col justify-end pb-16 px-6 max-w-screen-xl mx-auto transition-all duration-500 ${
          fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {/* Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="tag-brand text-xs">
            {isMovie ? '🎬 MOVIE' : '📺 SERIES'}
          </span>
          {item.vote_average > 0 && (
            <span className="rating-badge">
              <FiStar className="fill-amber-400" size={10} />
              {item.vote_average.toFixed(1)}
            </span>
          )}
          {year && <span className="text-white/40 text-xs font-mono">{year}</span>}
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl sm:text-7xl text-white leading-none tracking-wide mb-3 max-w-2xl drop-shadow-lg">
          {title}
        </h1>

        {/* Overview */}
        {item.overview && (
          <p className="text-white/60 font-body text-sm leading-relaxed max-w-xl line-clamp-2 mb-6">
            {item.overview}
          </p>
        )}

        {/* CTA buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link to={path} className="btn-brand px-6 py-3 text-sm">
            <FiPlay className="fill-white" />
            View Details
          </Link>
          <Link to={path} className="btn-ghost glass px-6 py-3 text-sm border border-white/10">
            <FiInfo />
            More Info
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-5 right-6 z-10 flex gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 300); }}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-brand-500' : 'w-1.5 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
