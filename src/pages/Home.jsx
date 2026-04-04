// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import MediaRow from '../components/MediaRow';
import { getPopularMovies, getPopularTV, getTrending, getTopRatedMovies, getNowPlaying } from '../api/tmdb';

export default function Home() {
  const [trending,    setTrending]    = useState([]);
  const [popular,     setPopular]     = useState([]);
  const [popularTV,   setPopularTV]   = useState([]);
  const [topRated,    setTopRated]    = useState([]);
  const [nowPlaying,  setNowPlaying]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [t, m, tv, tr, np] = await Promise.all([
          getTrending('all', 'day'),
          getPopularMovies(),
          getPopularTV(),
          getTopRatedMovies(),
          getNowPlaying(),
        ]);
        setTrending(t.results || []);
        setPopular(m.results || []);
        setPopularTV(tv.results || []);
        setTopRated(tr.results || []);
        setNowPlaying(np.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <HeroSection />

      {/* Content rows */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        <MediaRow
          title="🔥 Trending Today"
          items={trending}
          loading={loading}
          viewAllHref="/search?tab=trending"
        />
        <MediaRow
          title="🎬 Popular Movies"
          items={popular}
          loading={loading}
          viewAllHref="/search?tab=movies"
        />
        <MediaRow
          title="📺 Popular Series"
          items={popularTV}
          loading={loading}
          viewAllHref="/search?tab=series"
        />
        <MediaRow
          title="🏆 Top Rated"
          items={topRated}
          loading={loading}
          viewAllHref="/search?tab=top-rated"
        />
        <MediaRow
          title="🎭 Now Playing"
          items={nowPlaying}
          loading={loading}
        />
      </div>
    </div>
  );
}
