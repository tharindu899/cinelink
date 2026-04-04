// src/pages/Admin.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FiSearch, FiPlus, FiEdit2, FiTrash2, FiSave,
  FiX, FiRefreshCw, FiFilm, FiTv,
  FiLogOut, FiList, FiMessageSquare, FiLink,
  FiClock, FiCheckCircle, FiChevronDown, FiChevronUp,
  FiLayers, FiDownload,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { searchMulti, posterUrl } from '../api/tmdb';
import {
  saveEntry, deleteEntry, listenEntries,
  listenRequests, updateRequestStatus, deleteRequest,
  saveEpisode, deleteEpisode, listenEpisodes,
} from '../firebase/firestore';

const TABS = [
  { key: 'movies',   label: 'Movies',   icon: FiFilm },
  { key: 'series',   label: 'Series',   icon: FiTv   },
  { key: 'requests', label: 'Requests', icon: FiList },
];

const RESOLUTIONS = ['4K', '1080p', '720p', '480p', '360p'];
const QUALITIES   = ['BluRay', 'WEB-DL', 'WebRip', 'HDTV', 'CAMRip', 'HDRip', 'DVDRip', 'Blurry'];

// ── Multi-quality link input component ────────────────────────────────────────
function QualityLinksInput({ links, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-white/50 font-mono uppercase tracking-wider flex items-center gap-1.5">
        <FiDownload size={11} /> Download Links by Quality
      </label>
      <div className="space-y-2">
        {RESOLUTIONS.map(res => (
          <div key={res} className="flex items-center gap-2">
            <span className={`flex-shrink-0 w-14 text-center px-2 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              links[res]
                ? 'bg-brand-600 border-brand-500 text-white'
                : 'bg-dark-700 border-white/10 text-white/40'
            }`}>
              {res}
            </span>
            <input
              type="text"
              value={links[res] || ''}
              onChange={e => onChange({ ...links, [res]: e.target.value })}
              placeholder={`${res} download URL (optional)`}
              className="input-dark flex-1 py-2 text-xs"
            />
            {links[res] && (
              <button
                type="button"
                onClick={() => { const n = { ...links }; delete n[res]; onChange(n); }}
                className="flex-shrink-0 btn-ghost p-1.5 text-red-400 hover:text-red-300"
              >
                <FiX size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-white/25 font-body">Fill in only the qualities you have. Empty fields are ignored.</p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initLinksFromEntry(entry) {
  if (!entry) return {};
  if (entry.links && typeof entry.links === 'object') return { ...entry.links };
  if (entry.custom_link) return { HD: entry.custom_link };
  return {};
}

export default function Admin() {
  const { logout } = useAuth();
  const [tab,       setTab]       = useState('movies');
  const [movies,    setMovies]    = useState([]);
  const [series,    setSeries]    = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [showForm,  setShowForm]  = useState(false);
  const [editItem,  setEditItem]  = useState(null);
  const [episodeMgr, setEpisodeMgr] = useState(null);
  const [searchQ,   setSearchQ]   = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    const unsubM = listenEntries('movie',  setMovies);
    const unsubS = listenEntries('series', setSeries);
    const unsubR = listenRequests(setRequests);
    return () => { unsubM(); unsubS(); unsubR(); };
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQ.trim()) { setSearchRes([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await searchMulti(searchQ);
        setSearchRes((data.results || []).filter(r => r.media_type !== 'person').slice(0, 8));
      } catch { setSearchRes([]); }
      finally   { setSearching(false); }
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchQ]);

  const openAdd = (tmdbItem) => {
    const type   = tmdbItem.media_type === 'tv' || tmdbItem.name ? 'series' : 'movie';
    const fbList = type === 'movie' ? movies : series;
    const fb     = fbList.find(e => e.id === String(tmdbItem.id));
    setEditItem({ tmdbData: tmdbItem, fbData: fb || null, type });
    setShowForm(true);
    setSearchQ('');
    setSearchRes([]);
  };

  const openEdit = (fbEntry) => {
    setEditItem({
      tmdbData: {
        id:          parseInt(fbEntry.id),
        title:       fbEntry.title,
        name:        fbEntry.name,
        poster_path: fbEntry.poster_path,
        media_type:  fbEntry.type === 'movie' ? 'movie' : 'tv',
      },
      fbData: fbEntry,
      type: fbEntry.type,
    });
    setShowForm(true);
  };

  const handleDelete = async (entry) => {
    if (!window.confirm(`Delete "${entry.title || entry.name}" from CineLink?`)) return;
    try {
      await deleteEntry(entry.type, entry.id);
      toast.success('Entry deleted.');
    } catch { toast.error('Delete failed.'); }
  };

  const handleRequestAction = async (req, status) => {
    try {
      await updateRequestStatus(req.id, status);
      toast.success(`Request marked as ${status}.`);
    } catch { toast.error('Update failed.'); }
  };

  const handleDeleteRequest = async (req) => {
    if (!window.confirm(`Delete request for "${req.title}"?`)) return;
    try {
      await deleteRequest(req.id);
      toast.success('Request deleted.');
    } catch { toast.error('Delete failed.'); }
  };

  const handleFulfillWithData = async (req, links, note, resolution, quality) => {
    try {
      const noteParts = [resolution, quality, note.trim()].filter(Boolean);
      const finalNote = noteParts.join(' · ') || null;

      await saveEntry(req.type, req.tmdb_id, {
        title:       req.type === 'movie'  ? req.title : null,
        name:        req.type === 'series' ? req.title : null,
        poster_path: req.poster_path || null,
        links:       links,
        note:        finalNote,
      });
      await updateRequestStatus(req.id, 'fulfilled');
      toast.success('Request fulfilled & entry saved!');
    } catch (err) {
      console.error(err);
      toast.error(`Failed: ${err?.code || err?.message || 'Unknown error'}`);
    }
  };

  const currentList = tab === 'movies' ? movies : series;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl text-white tracking-wide">Admin Dashboard</h1>
            <p className="text-white/40 text-sm font-body mt-1">Manage movies, series & user requests</p>
          </div>
          <button onClick={logout} className="btn-ghost text-sm"><FiLogOut /> Logout</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Movies',   value: movies.length,   icon: FiFilm,  color: 'text-brand-400' },
            { label: 'Series',   value: series.length,   icon: FiTv,    color: 'text-blue-400'  },
            { label: 'Pending',  value: requests.filter(r => r.status === 'pending').length, icon: FiMessageSquare, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="glass rounded-2xl p-4 flex items-center gap-3">
              <s.icon size={22} className={s.color} />
              <div>
                <p className="font-display text-3xl text-white leading-none">{s.value}</p>
                <p className="text-white/40 text-xs font-body">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-body font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-brand-500 text-white' : 'border-transparent text-white/40 hover:text-white/70'
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {t.key === 'requests' && requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center">
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Movies / Series tab ── */}
        {(tab === 'movies' || tab === 'series') && (
          <div>
            <div className="glass rounded-2xl p-5 mb-6 border border-white/10">
              <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-3">
                Add / Update {tab === 'movies' ? 'Movie' : 'Series'}
              </p>
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
                <input
                  type="text"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder={`Search TMDb for ${tab}…`}
                  className="input-dark pl-10"
                />
                {searching && <FiRefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 animate-spin text-sm" />}
              </div>

              {searchRes.length > 0 && (
                <div className="mt-2 rounded-xl bg-dark-800 border border-white/10 overflow-hidden divide-y divide-white/5">
                  {searchRes.map(item => {
                    const isTV   = item.media_type === 'tv';
                    const name   = item.title || item.name;
                    const year   = (item.release_date || item.first_air_date || '').slice(0, 4);
                    const poster = posterUrl(item.poster_path, 'w92');
                    return (
                      <button key={item.id} onClick={() => openAdd(item)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left">
                        {poster
                          ? <img src={poster} alt="" className="w-8 h-12 object-cover rounded flex-shrink-0" />
                          : <div className="w-8 h-12 bg-dark-700 rounded flex-shrink-0 flex items-center justify-center">{isTV ? '📺' : '🎬'}</div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-body font-medium truncate">{name}</p>
                          <p className="text-white/40 text-xs">{isTV ? 'Series' : 'Movie'}{year && ` · ${year}`}</p>
                        </div>
                        <FiPlus size={14} className="text-brand-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {currentList.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-5xl mb-3">{tab === 'movies' ? '🎬' : '📺'}</div>
                <p className="font-body text-sm">No {tab} added yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentList.map(entry => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onManageEpisodes={entry.type === 'series'
                      ? () => setEpisodeMgr({ seriesId: entry.id, seriesTitle: entry.name || entry.title })
                      : null
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Requests tab ── */}
        {tab === 'requests' && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-body text-sm">No requests yet.</p>
              </div>
            ) : (
              requests.map(req => (
                <RequestRow
                  key={req.id}
                  req={req}
                  onAction={handleRequestAction}
                  onDelete={handleDeleteRequest}
                  onFulfillWithData={handleFulfillWithData}
                />
              ))
            )}
          </div>
        )}
      </div>

      {showForm && editItem && (
        <EntryFormModal item={editItem} onClose={() => { setShowForm(false); setEditItem(null); }} />
      )}

      {episodeMgr && (
        <EpisodeManagerModal
          seriesId={episodeMgr.seriesId}
          seriesTitle={episodeMgr.seriesTitle}
          onClose={() => setEpisodeMgr(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EntryRow
// ─────────────────────────────────────────────────────────────────────────────
function EntryRow({ entry, onEdit, onDelete, onManageEpisodes }) {
  const poster = posterUrl(entry.poster_path, 'w92');
  const title  = entry.title || entry.name;
  const date   = entry.added_date?.toDate ? entry.added_date.toDate().toLocaleDateString() : '—';
  const hasLinks = entry.links && Object.values(entry.links).some(Boolean);
  const linkCount = hasLinks ? Object.values(entry.links).filter(Boolean).length : (entry.custom_link ? 1 : 0);

  return (
    <div className="glass rounded-xl p-4 flex items-center gap-4 border border-white/5 hover:border-white/10 transition-colors">
      {poster
        ? <img src={poster} alt="" className="w-9 h-14 object-cover rounded flex-shrink-0" />
        : <div className="w-9 h-14 bg-dark-700 rounded flex-shrink-0 flex items-center justify-center text-lg">{entry.type === 'movie' ? '🎬' : '📺'}</div>
      }
      <div className="flex-1 min-w-0">
        <p className="text-white font-body font-semibold text-sm truncate">{title}</p>
        <p className="text-white/40 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
          <span>Added {date}</span>
          {linkCount > 0 && (
            <span className="flex items-center gap-1 text-brand-400">
              <FiDownload size={9} /> {linkCount} quality link{linkCount > 1 ? 's' : ''}
            </span>
          )}
          {entry.note && <span className="text-blue-400">{entry.note}</span>}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onManageEpisodes && (
          <button onClick={onManageEpisodes} className="btn-ghost py-1.5 px-2.5 text-amber-400 hover:text-amber-300 text-xs gap-1.5" title="Manage Episodes">
            <FiLayers size={13} /><span className="hidden sm:inline">Episodes</span>
          </button>
        )}
        <button onClick={() => onEdit(entry)} className="btn-ghost p-2 text-blue-400 hover:text-blue-300"><FiEdit2 size={14} /></button>
        <button onClick={() => onDelete(entry)} className="btn-ghost p-2 text-red-400 hover:text-red-300"><FiTrash2 size={14} /></button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EpisodeManagerModal
// ─────────────────────────────────────────────────────────────────────────────
function EpisodeManagerModal({ seriesId, seriesTitle, onClose }) {
  const [episodes, setEpisodes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    season: 1, episode: 1, title: '', links: {}, resolution: '', quality: '', note: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { return listenEpisodes(seriesId, setEpisodes); }, [seriesId]);

  const notePreview = [form.resolution, form.quality, form.note.trim()].filter(Boolean).join(' · ');
  const hasLinks = Object.values(form.links).some(Boolean);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cleanLinks = Object.fromEntries(Object.entries(form.links).filter(([, v]) => v.trim()));
      await saveEpisode(seriesId, form.season, form.episode, {
        title:   form.title.trim() || null,
        links:   Object.keys(cleanLinks).length > 0 ? cleanLinks : null,
        note:    notePreview || null,
      });
      toast.success(editingId ? 'Episode updated!' : 'Episode added!');
      resetForm();
    } catch (err) {
      toast.error(`Failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setForm({ season: 1, episode: 1, title: '', links: {}, resolution: '', quality: '', note: '' });
    setEditingId(null);
  };

  const handleEdit = (ep) => {
    const noteParts = (ep.note || '').split(' · ');
    const links = ep.links || (ep.custom_link ? { HD: ep.custom_link } : {});
    setEditingId(ep.id);
    setForm({
      season:     ep.season,
      episode:    ep.episode,
      title:      ep.title || '',
      links,
      resolution: noteParts.find(p => RESOLUTIONS.includes(p)) || '',
      quality:    noteParts.find(p => QUALITIES.includes(p))   || '',
      note:       noteParts.filter(p => !RESOLUTIONS.includes(p) && !QUALITIES.includes(p)).join(' · '),
    });
  };

  const handleDelete = async (ep) => {
    const label = `S${String(ep.season).padStart(2,'0')}E${String(ep.episode).padStart(2,'0')}`;
    if (!window.confirm(`Delete ${label}?`)) return;
    try {
      await deleteEpisode(seriesId, ep.id);
      toast.success('Episode deleted.');
      if (editingId === ep.id) resetForm();
    } catch { toast.error('Delete failed.'); }
  };

  const seasonGroups = episodes.reduce((acc, ep) => {
    if (!acc[ep.season]) acc[ep.season] = [];
    acc[ep.season].push(ep);
    return acc;
  }, {});
  const seasonNums = Object.keys(seasonGroups).map(Number).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/60 animate-fade-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="font-display text-2xl text-white tracking-wide">Manage Episodes</h3>
            <p className="text-white/40 text-xs font-body mt-0.5 truncate max-w-xs">{seriesTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 font-mono">{episodes.length} episodes</span>
            <button onClick={onClose} className="btn-ghost p-1.5"><FiX size={16}/></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Form */}
          <div className="glass rounded-xl p-4 border border-white/10 space-y-4">
            <p className="text-xs text-white/40 font-mono uppercase tracking-wider flex items-center gap-2">
              {editingId
                ? <><FiEdit2 size={11}/> Editing S{String(form.season).padStart(2,'0')}E{String(form.episode).padStart(2,'0')}</>
                : <><FiPlus size={11}/> Add Episode</>
              }
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 font-mono uppercase tracking-wider block mb-1.5">Season</label>
                <input type="number" min="1" value={form.season}
                  onChange={e => setForm(p => ({ ...p, season: Number(e.target.value) }))}
                  className="input-dark" disabled={!!editingId} />
              </div>
              <div>
                <label className="text-xs text-white/40 font-mono uppercase tracking-wider block mb-1.5">Episode</label>
                <input type="number" min="1" value={form.episode}
                  onChange={e => setForm(p => ({ ...p, episode: Number(e.target.value) }))}
                  className="input-dark" disabled={!!editingId} />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 font-mono uppercase tracking-wider block mb-1.5">
                Episode Title <span className="normal-case">(optional)</span>
              </label>
              <input type="text" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Winter is Coming" className="input-dark" />
            </div>

            {/* Multi-quality links */}
            <QualityLinksInput
              links={form.links}
              onChange={links => setForm(p => ({ ...p, links }))}
            />

            <div>
              <label className="text-xs text-white/40 font-mono uppercase tracking-wider block mb-2">Quality / Source Note</label>
              <div className="flex flex-wrap gap-2">
                {QUALITIES.map(q => (
                  <button key={q} type="button"
                    onClick={() => setForm(p => ({ ...p, quality: p.quality === q ? '' : q }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                      form.quality === q ? 'bg-blue-600 border-blue-500 text-white' : 'bg-dark-700 border-white/10 text-white/50 hover:text-white hover:border-white/30'
                    }`}>{q}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 font-mono uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <FiMessageSquare size={11}/> Extra Note <span className="normal-case">(optional)</span>
              </label>
              <input type="text" value={form.note}
                onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                placeholder="e.g. English subtitles, Dual audio…" className="input-dark" />
            </div>

            {notePreview && (
              <div className="rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-xs font-mono">
                <span className="text-white/40">Note preview → </span>
                <span className="text-white">{notePreview}</span>
              </div>
            )}

            <div className="flex gap-3">
              {editingId && <button type="button" onClick={resetForm} className="btn-ghost flex-1 justify-center">Cancel</button>}
              <button type="button" onClick={handleSave} disabled={saving}
                className="btn-brand flex-1 justify-center disabled:opacity-60">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Saving…
                  </span>
                ) : editingId ? <><FiSave size={14}/> Update</> : <><FiPlus size={14}/> Add Episode</>}
              </button>
            </div>
          </div>

          {/* Episodes list */}
          {episodes.length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <FiTv size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-body">No episodes added yet.</p>
            </div>
          ) : (
            seasonNums.map(season => (
              <div key={season}>
                <p className="text-xs text-white/40 font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FiTv size={13} className="text-brand-400" />
                  Season {season} · {seasonGroups[season].length} episode{seasonGroups[season].length > 1 ? 's' : ''}
                </p>
                <div className="space-y-2">
                  {seasonGroups[season].map(ep => {
                    const label = `S${String(ep.season).padStart(2,'0')}E${String(ep.episode).padStart(2,'0')}`;
                    const isEditing = editingId === ep.id;
                    const epLinks = ep.links || (ep.custom_link ? { HD: ep.custom_link } : {});
                    const linkCount = Object.values(epLinks).filter(Boolean).length;
                    return (
                      <div key={ep.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                          isEditing ? 'bg-brand-900/20 border-brand-500/30' : 'bg-dark-800 border-white/5 hover:border-white/10'
                        }`}>
                        <span className="font-mono text-xs text-brand-400 font-semibold flex-shrink-0 w-16">{label}</span>
                        <div className="flex-1 min-w-0">
                          {ep.title && <p className="text-white text-xs font-body font-medium truncate">{ep.title}</p>}
                          <div className="flex items-center gap-3 flex-wrap mt-0.5">
                            {ep.note && <p className="text-white/40 text-xs truncate">{ep.note}</p>}
                            {linkCount > 0 && (
                              <p className="text-brand-400 text-xs flex items-center gap-1">
                                <FiDownload size={9}/> {linkCount} link{linkCount > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => handleEdit(ep)} className={`btn-ghost p-1.5 ${isEditing ? 'text-brand-400' : 'text-blue-400 hover:text-blue-300'}`}>
                            <FiEdit2 size={12}/>
                          </button>
                          <button onClick={() => handleDelete(ep)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                            <FiTrash2 size={12}/>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RequestRow
// ─────────────────────────────────────────────────────────────────────────────
function RequestRow({ req, onAction, onDelete, onFulfillWithData }) {
  const [expanded, setExpanded] = useState(false);
  const [links,    setLinks]    = useState({});
  const [note,     setNote]     = useState('');
  const [quality,  setQuality]  = useState('');
  const [saving,   setSaving]   = useState(false);

  const statusColors = {
    pending:   'bg-amber-900/40 text-amber-300 border-amber-700/40',
    fulfilled: 'bg-green-900/40 text-green-300 border-green-700/40',
    rejected:  'bg-red-900/40  text-red-300   border-red-700/40',
  };

  const date = req.requested_at?.toDate ? req.requested_at.toDate().toLocaleString() : '—';
  const isEpisode = req.season != null && req.episode != null;
  const epLabel   = isEpisode ? `S${String(req.season).padStart(2,'0')}E${String(req.episode).padStart(2,'0')}` : null;
  const hasAnyLink = Object.values(links).some(Boolean);

  const handleFulfill = async () => {
    setSaving(true);
    await onFulfillWithData(req, links, note, '', quality);
    setSaving(false);
    setExpanded(false);
  };

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
        {req.poster_path && (
          <img src={`https://image.tmdb.org/t/p/w92${req.poster_path}`} alt="" className="w-9 h-14 object-cover rounded flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-body font-semibold text-sm">{req.title}</p>
            {epLabel && <span className="font-mono text-xs text-brand-400 font-semibold">{epLabel}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusColors[req.status] || statusColors.pending}`}>{req.status}</span>
            <span className="tag capitalize">{req.type}</span>
          </div>
          <p className="text-white/30 text-xs mt-1 flex items-center gap-1"><FiClock size={10} /> {date}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {req.status === 'pending' && (
            <>
              <button onClick={() => setExpanded(p => !p)}
                className={`btn-ghost py-1.5 px-3 text-xs gap-1.5 ${expanded ? 'text-brand-300' : 'text-brand-400'}`}>
                {expanded ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
                {expanded ? 'Close' : 'Fulfill'}
              </button>
              <button onClick={() => onAction(req, 'rejected')} className="btn-ghost py-1.5 px-3 text-xs text-red-400 hover:text-red-300">
                <FiX size={13} /> Reject
              </button>
            </>
          )}
          <button onClick={() => onDelete(req)} className="btn-ghost p-2 text-red-500 hover:text-red-400" title="Delete request">
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && req.status === 'pending' && (
        <div className="border-t border-white/10 bg-dark-800/50 p-4 space-y-5">
          {/* Multi-quality links */}
          <QualityLinksInput links={links} onChange={setLinks} />

          <div className="space-y-2">
            <label className="text-xs text-white/50 font-mono uppercase tracking-wider">Quality / Source</label>
            <div className="flex flex-wrap gap-2">
              {QUALITIES.map(q => (
                <button key={q} type="button" onClick={() => setQuality(p => p === q ? '' : q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    quality === q ? 'bg-blue-600 border-blue-500 text-white' : 'bg-dark-700 border-white/10 text-white/50 hover:text-white hover:border-white/30'
                  }`}>{q}</button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <FiMessageSquare size={11} /> Extra Note <span className="normal-case">(optional)</span>
            </label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. English subtitles, Dual audio…" className="input-dark" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setExpanded(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="button" onClick={handleFulfill} disabled={saving || !hasAnyLink}
              className="btn-brand flex-1 justify-center disabled:opacity-60">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : <><FiCheckCircle size={14} /> Fulfill & Save</>}
            </button>
          </div>

          {!hasAnyLink && (
            <p className="text-center text-xs text-white/30">Add at least one download link to fulfill this request.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EntryFormModal
// ─────────────────────────────────────────────────────────────────────────────
function EntryFormModal({ item, onClose }) {
  const { tmdbData, fbData, type } = item;
  const title  = tmdbData.title || tmdbData.name;
  const poster = posterUrl(tmdbData.poster_path, 'w185');

  const [links,   setLinks]   = useState(() => initLinksFromEntry(fbData));
  const [note,    setNote]    = useState('');
  const [quality, setQuality] = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (fbData?.note) {
      const parts = fbData.note.split(' · ');
      setQuality(parts.find(p => QUALITIES.includes(p)) || '');
      setNote(parts.filter(p => !QUALITIES.includes(p)).join(' · '));
    }
  }, []); // eslint-disable-line

  const notePreview = [quality, note.trim()].filter(Boolean).join(' · ');
  const hasLinks    = Object.values(links).some(Boolean);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const cleanLinks = Object.fromEntries(Object.entries(links).filter(([, v]) => v.trim()));
      await saveEntry(type, tmdbData.id, {
        title:       tmdbData.title || null,
        name:        tmdbData.name  || null,
        poster_path: tmdbData.poster_path || null,
        links:       Object.keys(cleanLinks).length > 0 ? cleanLinks : null,
        note:        notePreview || null,
      });
      toast.success(fbData ? 'Entry updated!' : 'Entry added!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(`Save failed: ${err?.code || err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/60 animate-fade-up overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg"><FiX size={16} /></button>

        <h3 className="font-display text-2xl text-white mb-5 tracking-wide pr-8">
          {fbData ? 'Edit Entry' : 'Add Entry'}
        </h3>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-700 border border-white/10 mb-6">
          {poster && <img src={poster} alt={title} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />}
          <div>
            <p className="font-body font-semibold text-white text-sm">{title}</p>
            <p className="text-white/40 text-xs capitalize">{type} · TMDb #{tmdbData.id}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Multi-quality links */}
          <QualityLinksInput links={links} onChange={setLinks} />

          <div className="space-y-2">
            <label className="text-xs text-white/50 font-mono uppercase tracking-wider">Quality / Source Note</label>
            <div className="flex flex-wrap gap-2">
              {QUALITIES.map(q => (
                <button key={q} type="button" onClick={() => setQuality(p => p === q ? '' : q)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    quality === q ? 'bg-blue-600 border-blue-500 text-white' : 'bg-dark-700 border-white/10 text-white/50 hover:text-white hover:border-white/30'
                  }`}>{q}</button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <FiMessageSquare size={11} /> Extra Note <span className="normal-case">(optional)</span>
            </label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. English subtitles, Dual audio…" className="input-dark" />
          </div>

          {notePreview && (
            <div className="rounded-lg bg-dark-700 border border-white/10 px-3 py-2 text-xs font-mono">
              <span className="text-white/40">Note → </span>
              <span className="text-white">{notePreview}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-brand flex-1 justify-center disabled:opacity-60">
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  Saving…
                </span>
              ) : <><FiSave size={14} /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
