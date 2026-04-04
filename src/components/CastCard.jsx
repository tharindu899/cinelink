// src/components/CastCard.jsx
import { Link } from 'react-router-dom';
import { profileUrl } from '../api/tmdb';

export default function CastCard({ person }) {
  const photo = profileUrl(person.profile_path, 'w185');

  return (
    <Link
      to={`/person/${person.id}`}
      className="flex-shrink-0 w-24 text-center group cursor-pointer"
    >
      <div className="relative w-20 h-20 mx-auto">
        {/* Glow ring on hover */}
        <div className="absolute inset-0 rounded-full bg-brand-500/0 group-hover:bg-brand-500/20 blur-md transition-all duration-300" />
        <div className="relative w-full h-full rounded-full overflow-hidden bg-dark-700 border-2 border-white/10 group-hover:border-brand-500/60 transition-all duration-300">
          {photo ? (
            <img
              src={photo}
              alt={person.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">👤</div>
          )}
        </div>
      </div>
      <p className="mt-2 text-white text-xs font-body font-semibold leading-tight line-clamp-2 group-hover:text-brand-300 transition-colors duration-200">
        {person.name}
      </p>
      {person.character && (
        <p className="text-white/40 text-xs font-body line-clamp-1 mt-0.5 group-hover:text-white/60 transition-colors duration-200">
          {person.character}
        </p>
      )}
    </Link>
  );
}
