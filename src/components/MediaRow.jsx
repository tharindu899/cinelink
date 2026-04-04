// src/components/MediaRow.jsx
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiArrowRight } from 'react-icons/fi';
import MovieCard from './MovieCard';
import { CardSkeleton } from './LoadingSpinner';

export default function MediaRow({ title, items, loading, viewAllHref }) {
  const rowRef = useRef(null);

  const scroll = (dir) => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <section className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="section-title">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              to={viewAllHref}
              className="text-xs text-brand-400 hover:text-brand-300 font-body font-medium flex items-center gap-1 transition-colors"
            >
              View all <FiArrowRight size={12} />
            </Link>
          )}
          <button onClick={() => scroll(-1)} className="btn-ghost p-1.5 rounded-lg hidden sm:flex">
            <FiChevronLeft size={16} />
          </button>
          <button onClick={() => scroll(1)}  className="btn-ghost p-1.5 rounded-lg hidden sm:flex">
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Scrollable row */}
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2"
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-36 sm:w-44">
                <CardSkeleton />
              </div>
            ))
          : items?.map((item, i) => (
              <div key={item.id} className="flex-shrink-0 w-36 sm:w-44">
                <MovieCard item={item} index={i} />
              </div>
            ))}
      </div>
    </section>
  );
}
