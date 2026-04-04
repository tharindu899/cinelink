// src/pages/PersonDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiAlertCircle, FiCalendar, FiMapPin, FiFilm,
  FiTv, FiExternalLink, FiAward, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import { getPersonDetails, profileUrl, posterUrl, backdropUrl } from '../api/tmdb';
import MovieCard from '../components/MovieCard';
import { DetailsSkeleton } from '../components/LoadingSpinner';

export default function PersonDetails() {
  const { id } = useParams();
  const [person,   setPerson]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filmTab,  setFilmTab]  = useState('movies');
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPerson(null);
    getPersonDetails(id)
      .then(setPerson)
      .catch(console.error)
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <DetailsSkeleton />;
  if (!person) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <FiAlertCircle size={48} className="text-white/30 mx-auto" />
        <p className="text-white/50">Person not found.</p>
        <Link to="/" className="btn-brand inline-block">Go Home</Link>
      </div>
    </div>
  );

  const photo    = profileUrl(person.profile_path, 'w342');
  const photoBig = profileUrl(person.profile_path, 'original');

  // Known for: combine movie + TV credits, sort by vote_count desc, take top 8
  const allCredits = [
    ...(person.movie_credits?.cast || []).map(c => ({ ...c, media_type: 'movie' })),
    ...(person.tv_credits?.cast    || []).map(c => ({ ...c, media_type: 'tv'    })),
  ];

  // Deduplicate by id+media_type, sort by vote_count
  const knownForMap = new Map();
  allCredits.forEach(c => {
    const key = `${c.media_type}-${c.id}`;
    if (!knownForMap.has(key) || (c.vote_count || 0) > (knownForMap.get(key).vote_count || 0)) {
      knownForMap.set(key, c);
    }
  });
  const knownFor = [...knownForMap.values()]
    .filter(c => c.poster_path)
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    .slice(0, 8);

  // Filmography
  const movieCredits = (person.movie_credits?.cast || [])
    .filter(c => c.poster_path && c.title)
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

  const tvCredits = (person.tv_credits?.cast || [])
    .filter(c => c.poster_path && c.name)
    .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

  const filmList = filmTab === 'movies' ? movieCredits : tvCredits;

  const age = person.birthday
    ? Math.floor((new Date() - new Date(person.birthday)) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const bioPreview = person.biography?.slice(0, 380);
  const bioLong    = person.biography && person.biography.length > 380;

  const deptIcon = { Acting: '🎭', Directing: '🎬', Writing: '✍️', Production: '⚙️' };

  return (
    <div className="min-h-screen pb-16">

      {/* ── Hero ── */}
      <div className="relative h-[45vh] overflow-hidden">
        {/* Blurred photo background */}
        {photoBig ? (
          <img
            src={photoBig}
            alt=""
            className="w-full h-full object-cover object-top scale-110 blur-lg opacity-30"
          />
        ) : (
          <div className="w-full h-full bg-dark-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950/60 via-dark-950/40 to-dark-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 -mt-52 relative z-10">
        <div className="flex flex-col sm:flex-row gap-8 items-start">

          {/* Profile photo */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute -inset-1 rounded-2xl bg-brand-600/30 blur-xl" />
              <div className="relative w-44 sm:w-52 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/70">
                {photo ? (
                  <img src={photo} alt={person.name} className="w-full aspect-[2/3] object-cover" />
                ) : (
                  <div className="aspect-[2/3] bg-dark-700 flex items-center justify-center text-6xl">👤</div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-5 pt-2">
            {/* Department badge */}
            {person.known_for_department && (
              <div className="tag-brand w-fit">
                {deptIcon[person.known_for_department] || '🎬'} {person.known_for_department}
              </div>
            )}

            {/* Name */}
            <h1 className="font-display text-5xl sm:text-7xl text-white leading-none tracking-wide">
              {person.name}
            </h1>

            {/* Personal info row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
              {person.birthday && (
                <span className="flex items-center gap-1.5">
                  <FiCalendar size={13} className="text-brand-400" />
                  {new Date(person.birthday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  {age && !person.deathday && (
                    <span className="text-white/30 text-xs">· {age} yrs</span>
                  )}
                </span>
              )}
              {person.deathday && (
                <span className="flex items-center gap-1.5 text-red-400/70">
                  <FiCalendar size={13} />
                  Died {new Date(person.deathday).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
              {person.place_of_birth && (
                <span className="flex items-center gap-1.5">
                  <FiMapPin size={13} className="text-brand-400" />
                  {person.place_of_birth}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3">
              {movieCredits.length > 0 && (
                <div className="glass rounded-xl px-4 py-2.5 border border-white/5 flex items-center gap-2">
                  <FiFilm size={14} className="text-brand-400" />
                  <div>
                    <p className="font-display text-xl text-white leading-none">{movieCredits.length}</p>
                    <p className="text-white/40 text-xs font-body">Movies</p>
                  </div>
                </div>
              )}
              {tvCredits.length > 0 && (
                <div className="glass rounded-xl px-4 py-2.5 border border-white/5 flex items-center gap-2">
                  <FiTv size={14} className="text-blue-400" />
                  <div>
                    <p className="font-display text-xl text-white leading-none">{tvCredits.length}</p>
                    <p className="text-white/40 text-xs font-body">TV Shows</p>
                  </div>
                </div>
              )}
            </div>

            {/* Biography */}
            {person.biography && (
              <div className="max-w-2xl space-y-2">
                <p className="text-white/70 font-body text-sm leading-relaxed">
                  {bioExpanded ? person.biography : bioPreview}
                  {!bioExpanded && bioLong && '…'}
                </p>
                {bioLong && (
                  <button
                    onClick={() => setBioExpanded(p => !p)}
                    className="text-brand-400 text-xs font-body flex items-center gap-1 hover:text-brand-300 transition-colors"
                  >
                    {bioExpanded ? <><FiChevronUp size={13} /> Show less</> : <><FiChevronDown size={13} /> Read more</>}
                  </button>
                )}
              </div>
            )}

            {/* External links */}
            {person.external_ids?.imdb_id && (
              <a
                href={`https://www.imdb.com/name/${person.external_ids.imdb_id}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost glass border border-white/10 inline-flex text-sm"
              >
                <FiExternalLink size={13} /> IMDb Profile
              </a>
            )}
          </div>
        </div>

        {/* ── Known For ── */}
        {knownFor.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <FiAward size={18} className="text-amber-400" />
              <h2 className="section-title">Known For</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {knownFor.map((credit, i) => (
                <MovieCard
                  key={`${credit.media_type}-${credit.id}`}
                  item={credit}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Filmography ── */}
        {(movieCredits.length > 0 || tvCredits.length > 0) && (
          <section className="mt-14">
            <h2 className="section-title mb-6">Filmography</h2>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {movieCredits.length > 0 && (
                <button
                  onClick={() => setFilmTab('movies')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-200 ${
                    filmTab === 'movies'
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/40'
                      : 'bg-dark-700 text-white/60 hover:text-white hover:bg-dark-600'
                  }`}
                >
                  <FiFilm size={13} /> Movies
                  <span className="bg-white/20 text-white/80 text-xs rounded-md px-1.5 py-0.5 font-mono">
                    {movieCredits.length}
                  </span>
                </button>
              )}
              {tvCredits.length > 0 && (
                <button
                  onClick={() => setFilmTab('tv')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-200 ${
                    filmTab === 'tv'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                      : 'bg-dark-700 text-white/60 hover:text-white hover:bg-dark-600'
                  }`}
                >
                  <FiTv size={13} /> TV Series
                  <span className="bg-white/20 text-white/80 text-xs rounded-md px-1.5 py-0.5 font-mono">
                    {tvCredits.length}
                  </span>
                </button>
              )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filmList.slice(0, 24).map((credit, i) => (
                <MovieCard
                  key={`${filmTab}-${credit.id}`}
                  item={credit}
                  index={i}
                />
              ))}
            </div>

            {filmList.length > 24 && (
              <p className="text-center text-white/30 text-sm font-body mt-6">
                Showing top 24 of {filmList.length} credits
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
