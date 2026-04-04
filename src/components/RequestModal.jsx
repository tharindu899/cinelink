// src/components/RequestModal.jsx
import { useState } from 'react';
import { FiX, FiSend, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { submitRequest } from '../firebase/firestore';

export default function RequestModal({ item, type, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | loading | done

  const title = item.title || item.name;

  const handleRequest = async () => {
    setStatus('loading');
    try {
      const requestedAt = new Date().toISOString();

      // 1. Save to Firestore
      await submitRequest({
        tmdb_id:    item.id,
        title,
        type,
        poster_path: item.poster_path,
        requested_at: requestedAt,
      });

      // 2. Send to Telegram via serverless function
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          tmdbId: item.id,
          requestedAt,
        }),
      });

      if (!res.ok) {
        // Telegram failed but request was saved — still mark as done
        console.warn('Telegram notification failed but request was saved.');
      }

      setStatus('done');
      toast.success('Request sent successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send request. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/60 animate-fade-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg"
        >
          <FiX size={18} />
        </button>

        {status === 'done' ? (
          <div className="text-center py-6 space-y-4">
            <div className="flex justify-center">
              <FiCheckCircle size={52} className="text-brand-400" />
            </div>
            <h3 className="font-display text-2xl text-white">Request Sent!</h3>
            <p className="text-white/60 font-body text-sm">
              Your request for <span className="text-white font-semibold">{title}</span> has been
              forwarded. Our team will add it as soon as possible.
            </p>
            <button onClick={onClose} className="btn-brand mt-2">Done</button>
          </div>
        ) : (
          <>
            <h3 className="font-display text-2xl text-white mb-1">Request This Title</h3>
            <p className="text-white/50 text-sm font-body mb-6">
              Can't find a link for this title? Send a request and we'll add it.
            </p>

            {/* Item info */}
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
                <p className="text-white/40 text-xs capitalize">{type}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="btn-ghost flex-1 justify-center"
              >
                Cancel
              </button>
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
                  <>
                    <FiSend size={14} />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
