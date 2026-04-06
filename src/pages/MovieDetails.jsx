// src/pages/MovieDetails.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiStar,
  FiClock,
  FiCalendar,
  FiExternalLink,
  FiMessageSquare,
  FiAlertCircle,
  FiDownload,
  FiArrowLeft,
  FiHeart,
  FiPlay,
} from "react-icons/fi";
import { getMovieDetails, backdropUrl, posterUrl } from "../api/tmdb";
import { getEntry } from "../firebase/firestore";
import CastCard from "../components/CastCard";
import MovieCard from "../components/MovieCard";
import RequestModal from "../components/RequestModal";
import { DetailsSkeleton } from "../components/LoadingSpinner";

// ── Helper: get quality→url map from fbData ───────────────────────────────────
function getQualityLinks(fbData) {
  if (!fbData) return null;
  if (fbData.links && typeof fbData.links === "object") {
    const filtered = Object.fromEntries(
      Object.entries(fbData.links).filter(([, v]) => v),
    );
    if (Object.keys(filtered).length > 0) return filtered;
  }
  if (fbData.custom_link) return { HD: fbData.custom_link };
  return null;
}

// ── Quality Download Button ────────────────────────────────────────────────────
function DownloadButton({ qualityLinks }) {
  const keys = Object.keys(qualityLinks);
  const [selected, setSelected] = useState(keys[0]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {keys.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {keys.map((q) => (
            <button
              key={q}
              onClick={() => setSelected(q)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all duration-150 ${
                selected === q
                  ? "bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/40"
                  : "bg-dark-700/80 border-white/15 text-white/60 hover:text-white hover:border-white/30"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <a
        href={qualityLinks[selected]}
        target="_blank"
        rel="noreferrer noopener"
        className="btn-brand text-sm"
      >
        <FiDownload size={13} />
        Download{keys.length === 1 ? ` · ${selected}` : ` · ${selected}`}
        <FiExternalLink size={11} />
      </a>
    </div>
  );
}

function QualityBadges({ qualityLinks }) {
  if (!qualityLinks) return null;
  const qualities = Object.keys(qualityLinks);
  return (
    <div className="flex flex-wrap gap-1.5">
      {qualities.map((q) => (
        <span
          key={q}
          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-900/40 text-green-400 border border-green-700/40"
        >
          {q}
        </span>
      ))}
    </div>
  );
}

// ── Watchlist helper (localStorage) ───────────────────────────────────────────
function useWatchlist(id, type = "movie") {
  const key = `watchlist_${type}_${id}`;
  const [saved, setSaved] = useState(() => !!localStorage.getItem(key));
  const toggle = () => {
    if (saved) localStorage.removeItem(key);
    else localStorage.setItem(key, "1");
    setSaved((p) => !p);
  };
  return [saved, toggle];
}

export default function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [fbData, setFbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReq, setShowReq] = useState(false);
  const [saved, toggleSaved] = useWatchlist(id, "movie");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMovie(null);
      setFbData(null);
      try {
        const [tmdbData, firebaseData] = await Promise.all([
          getMovieDetails(id),
          getEntry("movie", id),
        ]);
        setMovie(tmdbData);
        setFbData(firebaseData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <DetailsSkeleton />;
  if (!movie)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <FiAlertCircle size={48} className="text-white/30 mx-auto" />
          <p className="text-white/50">Movie not found.</p>
          <Link to="/" className="btn-brand inline-block">
            Go Home
          </Link>
        </div>
      </div>
    );

  const backdrop = backdropUrl(movie.backdrop_path, "original");
  const poster = posterUrl(movie.poster_path, "w500");
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;
  const year = movie.release_date?.slice(0, 4);
  const cast = movie.credits?.cast?.slice(0, 12) || [];
  const similar = [
    ...(movie.similar?.results || []),
    ...(movie.recommendations?.results || []),
  ].slice(0, 12);
  const trailer = movie.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  );
  const genres = movie.genres || [];
  const qualityLinks = getQualityLinks(fbData);

  const addedDate = fbData?.added_date?.toDate
    ? fbData.added_date
        .toDate()
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
    : null;

  return (
    <div className="min-h-screen pb-16">
      {/* ── HERO ── */}
      <div className="relative">
        <div className="absolute inset-0 h-full min-h-[520px]">
          {backdrop && (
            <img
              src={backdrop}
              alt=""
              className="w-full h-full object-cover object-top"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/85 to-dark-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950/70" />
        </div>

        <div className="relative z-10 max-w-screen-xl mx-auto px-4 sm:px-6 pt-28 pb-14">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm font-body mb-6 transition-colors group"
          >
            <FiArrowLeft
              size={14}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back
          </button>

          <div className="flex flex-row gap-7 sm:gap-10 items-start">
            <div className="flex-shrink-0 w-28 sm:w-44 md:w-52 lg:w-60">
              <div
                className="rounded-2xl overflow-hidden border border-white/10"
                style={{ boxShadow: "0 24px 72px -8px rgba(0,0,0,0.95)" }}
              >
                {poster ? (
                  <img src={poster} alt={movie.title} className="w-full block" />
                ) : (
                  <div className="aspect-[2/3] bg-dark-700 flex items-center justify-center text-4xl">
                    🎬
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-3 sm:space-y-4 pt-1 sm:pt-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="tag-brand text-xs">🎬 MOVIE</span>
                {qualityLinks && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-green-900/40 text-green-400 border border-green-700/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Available
                  </span>
                )}
              </div>

              <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white leading-[0.95] tracking-wide">
                {movie.title}
                {qualityLinks && <QualityBadges qualityLinks={qualityLinks} />}
              </h1>

              {movie.tagline && (
                <p className="text-white/40 font-body italic text-xs sm:text-sm">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {movie.vote_average > 0 && (
                  <span className="rating-badge">
                    <FiStar className="fill-amber-400" size={10} />
                    {movie.vote_average.toFixed(1)}
                  </span>
                )}
                {year && (
                  <span className="flex items-center gap-1 text-white/50 text-xs sm:text-sm">
                    <FiCalendar size={11} /> {year}
                  </span>
                )}
                {runtime && (
                  <span className="flex items-center gap-1 text-white/50 text-xs sm:text-sm">
                    <FiClock size={11} /> {runtime}
                  </span>
                )}
                {movie.original_language && (
                  <span className="tag uppercase text-xs">
                    {movie.original_language}
                  </span>
                )}
              </div>

              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span key={g.id} className="tag text-xs">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {movie.overview && (
                <p className="text-white/65 font-body text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-4 max-w-2xl">
                  {movie.overview}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {trailer && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost glass border border-white/15 text-sm"
                  >
                    <FiPlay size={12} /> Trailer
                  </a>
                )}
                <button
                  onClick={toggleSaved}
                  className={`btn-ghost p-2.5 rounded-xl border ${
                    saved
                      ? "border-red-500/50 text-red-400 bg-red-900/20"
                      : "border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  <FiHeart size={16} className={saved ? "fill-red-400" : ""} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 space-y-14 mt-10">
        {/* Available panel */}
        {fbData && qualityLinks && (
          <div className="glass rounded-2xl p-5 border-l-4 border-brand-500 space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 shadow shadow-green-400/60" />
              <p className="text-xs text-brand-400 font-mono uppercase tracking-wider">
                Available on CineLink
              </p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
              {addedDate && (
                <span className="flex items-center gap-1.5">
                  <FiCalendar size={12} className="text-brand-400" /> Added{" "}
                  {addedDate}
                </span>
              )}
              {fbData.note && (
                <span className="flex items-center gap-1.5">
                  <FiMessageSquare size={12} className="text-brand-400" />
                  <span className="font-mono text-xs">{fbData.note}</span>
                </span>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs text-white/30 font-mono uppercase tracking-wider">
                Available Qualities
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(qualityLinks).map(([q, url]) => (
                  <a
                    key={q}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
                  >
                    <FiDownload size={12} />
                    {q}
                    <FiExternalLink size={10} className="opacity-60" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Not Available panel (matching series style) */}
        {!fbData && (
          <div className="glass rounded-2xl p-5 border-l-4 border-white/10
                          flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-white/70 font-body font-semibold">Not yet available on CineLink</p>
              <p className="text-white/35 text-sm font-body mt-0.5">
                Request this movie and our team will add it as soon as possible.
              </p>
            </div>
            <button onClick={() => setShowReq(true)}
              className="btn-brand text-sm flex-shrink-0">
              <FiMessageSquare size={13} /> Request Movie
            </button>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Status", value: movie.status },
            {
              label: "Budget",
              value: movie.budget > 0 ? `$${(movie.budget / 1e6).toFixed(1)}M` : null,
            },
            {
              label: "Revenue",
              value: movie.revenue > 0 ? `$${(movie.revenue / 1e6).toFixed(1)}M` : null,
            },
            { label: "Votes", value: movie.vote_count?.toLocaleString() },
          ]
            .filter((i) => i.value)
            .map((item) => (
              <div key={item.label} className="glass rounded-xl p-4">
                <p className="text-xs text-white/30 font-mono uppercase tracking-wider mb-1">
                  {item.label}
                </p>
                <p className="text-white font-body font-semibold text-sm">
                  {item.value}
                </p>
              </div>
            ))}
        </section>

        {/* Cast */}
        {cast.length > 0 && (
          <section>
            <h2 className="section-title mb-6">Cast</h2>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
              {cast.map((p) => (
                <CastCard key={p.id} person={p} />
              ))}
            </div>
          </section>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <section>
            <h2 className="section-title mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similar.map((item, i) => (
                <MovieCard
                  key={item.id}
                  item={{ ...item, media_type: "movie" }}
                  index={i}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {showReq && (
        <RequestModal
          item={movie}
          type="movie"
          onClose={() => setShowReq(false)}
        />
      )}
    </div>
  );
}