// src/components/CastCard.jsx
import { profileUrl } from '../api/tmdb';

export default function CastCard({ person }) {
  const photo = profileUrl(person.profile_path, 'w185');

  return (
    <div className="flex-shrink-0 w-24 text-center group">
      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-dark-700 border-2 border-white/10 group-hover:border-brand-500/50 transition-colors">
        {photo ? (
          <img src={photo} alt={person.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">👤</div>
        )}
      </div>
      <p className="mt-2 text-white text-xs font-body font-semibold leading-tight line-clamp-2">{person.name}</p>
      {person.character && (
        <p className="text-white/40 text-xs font-body line-clamp-1 mt-0.5">{person.character}</p>
      )}
    </div>
  );
}
