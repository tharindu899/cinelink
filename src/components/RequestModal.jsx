// src/components/RequestModal.jsx
import { useState, useEffect } from 'react';
import { FiX, FiSend, FiCheckCircle, FiAlertCircle, FiTv } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { submitRequest, checkExistingRequest } from '../firebase/firestore';

export default function RequestModal({ item, type, season = null, episode = null, onClose }) {
  // idle | checking | already_requested | loading | done
  const [status,   setStatus]   = useState('idle');
  const [existing, setExisting] = useState(null);

  const title      = item.title || item.name;
  const isEpisode  = season != null && episode != null;
  const epLabel    = isEpisode
    ? `S${String(season).padStart(2, '0')} E${String(episode).padStart(2, '0')}`
    : null;

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      setStatus('checking');
      try {
        const found = await checkExistingRequest(item.id, season, episode);
        if (cancelled) return;
        if (found) {
          setExisting(found);
          setStatus('already_requested');
        } else {
          setStatus('idle');
        }
      } catch {
        if (!cancelled) setStatus('idle');
      }
    };
    check();
    return () => { cancelled = true; };
  }, [item.id, season, episode]);

  const handleRequest = async () => {
    setStatus('loading');
    try {
      const requestedAt = new Date().toISOString();

      const requestData = {
        tmdb_id:      item.id,
        title,
        type,
        poster_path:  item.poster_path,
        requested_at: requestedAt,
        ...(isEpisode ? { season, episode } : {}),
      };

      await submitRequest(requestData);

      // Notify Telegram (best-effort)
      const res = await fetch('/api/telegram', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title,
          type,
          tmdbId: item.id,
          requestedAt,
          ...(isEpisode ? { season, episode } : {}),
        }),
      });
      if (!res.ok) console.warn('Telegram notification failed but request was saved.');

      setStatus('done');
      toast.success('Request sent successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send request. Please try again.');
      setStatus('idle');
    }
  };

  const statusLabel = {
    pending:   { text: 'Pending review',       color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-700/40' },
    fulfilled: { text: 'Already added!',        color: 'text-green-400', bg: 'bg-green-900/30 border-green-700/40' },
    rejected:  { text: 'Previously rejected',   color: 'text-red-400',   bg: 'bg-red-900/30 border-red-700/40'   },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/60 animate-fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg">
          <FiX size={18} />
        </button>

        {/* ── Checking ── */}
        {status === 'checking' && (
          <div className="text-center py-8 space-y-3">
            <span className="w-8 h-8 border-2 border-white/20 border-t-brand-500 rounded-full animate-spin inline-block" />
            <p className="text-white/40 text-sm font-body">Checking existing requests…</p>
          </div>
        )}

        {/* ── Already requested ── */}
        {status === 'already_requested' && existing && (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <FiAlertCircle size={20} className="text-amber-400 flex-shrink-0" />
              <h3 className="font-display text-2xl text-white">Already Requested</h3>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700 border border-white/10">
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                  alt={title}
                  className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div>
                <p className="font-body font-semibold text-white text-sm">{title}</p>
                {epLabel && (
                  <p className="text-brand-400 text-xs font-mono font-semibold mt-0.5">{epLabel}</p>
                )}
                <p className="text-white/40 text-xs capitalize">{type}</p>
              </div>
            </div>
            {existing.status && statusLabel[existing.status] && (
              <div className={`flex items-center gap-2 rounded-xl px-4 py-3 border text-sm font-body ${statusLabel[existing.status].bg}`}>
                <span className={`font-semibold ${statusLabel[existing.status].color}`}>
                  {statusLabel[existing.status].text}
                </span>
                {existing.status === 'fulfilled' && (
                  <span className="text-white/50 text-xs">— check the page for the watch link.</span>
                )}
                {existing.status === 'pending' && (
                  <span className="text-white/50 text-xs">— our team will add it soon.</span>
                )}
                {existing.status === 'rejected' && (
                  <span className="text-white/50 text-xs">— this can't be added right now.</span>
                )}
              </div>
            )}
            <button onClick={onClose} className="btn-brand w-full justify-center">Got it</button>
          </div>
        )}

        {/* ── Done ── */}
        {status === 'done' && (
          <div className="text-center py-6 space-y-4">
            <div className="flex justify-center">
              <FiCheckCircle size={52} className="text-brand-400" />
            </div>
            <h3 className="font-display text-2xl text-white">Request Sent!</h3>
            <p className="text-white/60 font-body text-sm">
              Your request for{' '}
              <span className="text-white font-semibold">{title}</span>
              {epLabel && <span className="text-brand-400 font-mono"> {epLabel}</span>}{' '}
              has been forwarded. Our team will add it as soon as possible.
            </p>
            <button onClick={onClose} className="btn-brand mt-2">Done</button>
          </div>
        )}

        {/* ── Idle / loading ── */}
        {(status === 'idle' || status === 'loading') && (
          <>
            <h3 className="font-display text-2xl text-white mb-1">
              {isEpisode ? 'Request This Episode' : 'Request This Title'}
            </h3>
            <p className="text-white/50 text-sm font-body mb-6">
              {isEpisode
                ? "Can't find this episode? Send a request and we'll add it."
                : "Can't find a link? Send a request and we'll add it."}
            </p>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700 border border-white/10 mb-6">
              {item.poster_path && (
                <img
                  src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                  alt={title}
                  className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <div>
                <p className="font-body font-semibold text-white text-sm">{title}</p>
                {epLabel && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <FiTv size={11} className="text-brand-400" />
                    <span className="text-brand-400 text-xs font-mono font-semibold">{epLabel}</span>
                  </div>
                )}
                <p className="text-white/40 text-xs capitalize mt-0.5">{type}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button
                onClick={handleRequest}
                disabled={status === 'loading'}
                className="btn-brand flex-1 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : (
                  <><FiSend size={14} /> Send Request</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
