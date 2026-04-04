// src/components/MovieCard.jsx
import { Link } from 'react-router-dom';
import { FiStar, FiCalendar } from 'react-icons/fi';
import { posterUrl } from '../api/tmdb';

export default function MovieCard({ item, index = 0 }) {
  const isMovie    = item.media_type === 'movie' || item.title !== undefined;
  const title      = item.title || item.name || 'Unknown';
  const year       = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating     = item.vote_average?.toFixed(1);
  const poster     = posterUrl(item.poster_path, 'w342');
  const path       = isMovie ? `/movie/${item.id}` : `/series/${item.id}`;

  return (
    <Link
      to={path}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-dark-800 border border-white/5
                 hover:border-brand-500/40 hover:shadow-2xl hover:shadow-brand-900/30
                 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden bg-dark-700">
        {poster ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <span className="text-5xl">🎬</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-card-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating badge */}
        {rating && (
          <div className="absolute top-2 right-2 rating-badge">
            <FiStar className="fill-amber-400" size={10} />
            {rating}
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded-md text-xs font-mono font-semibold
                           bg-dark-900/80 text-white/60 border border-white/10">
            {isMovie ? 'MOVIE' : 'SERIES'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1 flex-1 flex flex-col">
        <h3 className="font-body font-semibold text-sm text-white line-clamp-2 leading-snug group-hover:text-brand-300 transition-colors">
          {title}
        </h3>
        {year && (
          <p className="text-xs text-white/40 font-body flex items-center gap-1 mt-auto pt-1">
            <FiCalendar size={10} />
            {year}
          </p>
        )}
      </div>
    </Link>
  );
}
