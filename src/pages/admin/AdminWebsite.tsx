import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/shared/AdminSidebar';
import { publicAssetUrl, type WebsiteEvent, type WebsiteSpace } from '../../services/websiteService';
import {
  adminCreateEvent,
  adminCreateSpace,
  adminDeleteEvent,
  adminDeleteSpace,
  adminFetchEventBookingCounts,
  adminFetchEventBookings,
  adminFetchEvents,
  adminFetchSpaces,
  adminUpdateEvent,
  adminUpdateSpace,
  uploadPublicAsset,
  type WebsiteBooking,
} from '../../services/adminWebsiteService';

const cv = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };
const ci = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function AdminWebsite() {
  const [tab, setTab] = useState<'spaces' | 'events'>('spaces');
  const [spaces, setSpaces] = useState<WebsiteSpace[]>([]);
  const [events, setEvents] = useState<WebsiteEvent[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventBookings, setEventBookings] = useState<WebsiteBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create space form
  const [sTitle, setSTitle] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sCategory, setSCategory] = useState('');
  const [sOrder, setSOrder] = useState('0');
  const [sImage, setSImage] = useState<file | null>(null);
  const [savingSpace, setSavingSpace] = useState(false);

  // Create event form
  const [eTitle, setETitle] = useState('');
  const [eDesc, setEDesc] = useState('');
  const [eType, setEType] = useState('');
  const [eLoc, setELoc] = useState('');
  const [eStartsAt, setEStartsAt] = useState('');
  const [eCapacity, setECapacity] = useState('25');
  const [ePrice, setEPrice] = useState('Free');
  const [eImage, setEImage] = useState<file | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);

  // Editing modals
  const [editSpace, setEditSpace] = useState<WebsiteSpace | null>(null);
  const [esTitle, setEsTitle] = useState('');
  const [esDesc, setEsDesc] = useState('');
  const [esCategory, setEsCategory] = useState('');
  const [esOrder, setEsOrder] = useState('0');
  const [esImage, setEsImage] = useState<file | null>(null);
  const [savingEditSpace, setSavingEditSpace] = useState(false);

  const [editEvent, setEditEvent] = useState<WebsiteEvent | null>(null);
  const [eeTitle, setEeTitle] = useState('');
  const [eeDesc, setEeDesc] = useState('');
  const [eeType, setEeType] = useState('');
  const [eeLoc, setEeLoc] = useState('');
  const [eeStartsAt, setEeStartsAt] = useState('');
  const [eeCapacity, setEeCapacity] = useState('25');
  const [eePrice, setEePrice] = useState('Free');
  const [eeActive, setEeActive] = useState(true);
  const [eeImage, setEeImage] = useState<file | null>(null);
  const [savingEditEvent, setSavingEditEvent] = useState(false);

  const refresh = async () => {
    const [s, e, counts] = await Promise.all([adminFetchSpaces(), adminFetchEvents(), adminFetchEventBookingCounts()]);
    setSpaces(s);
    setEvents(e);
    setBookingCounts(counts);
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        await refresh();
        if (!cancelled) setLoading(false);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadBookings() {
      if (!selectedEventId) { setEventBookings([]); return; }
      try {
        const rows = await adminFetchEventBookings(selectedEventId);
        if (!cancelled) setEventBookings(rows);
      } catch {
        if (!cancelled) setEventBookings([]);
      }
    }
    loadBookings();
    return () => { cancelled = true; };
  }, [selectedEventId]);

  const nextEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [events]);

  const handleCreateSpace = async () => {
    if (!sTitle.trim()) { setError('Space title is required.'); return; }
    if (!sImage) { setError('Space image is required.'); return; }
    setSavingSpace(true);
    setError('');
    try {
      const imagePath = await uploadPublicAsset(sImage, 'spaces');
      await adminCreateSpace({
        title: sTitle.trim(),
        description: sDesc.trim() || null,
        category: sCategory.trim() || null,
        imagePath,
        orderIndex: Number(sOrder) || 0,
      });
      setSTitle(''); setSDesc(''); setSCategory(''); setSOrder('0'); setSImage(null);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create space');
    } finally {
      setSavingSpace(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eTitle.trim()) { setError('Event title is required.'); return; }
    if (!eStartsAt) { setError('Event start date/time is required.'); return; }
    setSavingEvent(true);
    setError('');
    try {
      const imagePath = eImage ? await uploadPublicAsset(eImage, 'events') : null;
      await adminCreateEvent({
        title: eTitle.trim(),
        description: eDesc.trim() || null,
        startsAt: new Date(eStartsAt).toISOString(),
        location: eLoc.trim() || null,
        type: eType.trim() || null,
        imagePath,
        capacity: Number(eCapacity) || null,
        price: ePrice.trim() || null,
        isActive: true,
      });
      setETitle(''); setEDesc(''); setEType(''); setELoc(''); setEStartsAt(''); setECapacity('25'); setEPrice('Free'); setEImage(null);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create event');
    } finally {
      setSavingEvent(false);
    }
  };

  const openEditSpace = (s: WebsiteSpace) => {
    setEditSpace(s);
    setEsTitle(s.title);
    setEsDesc(s.description ?? '');
    setEsCategory(s.category ?? '');
    setEsOrder(String(s.order_index ?? 0));
    setEsImage(null);
    setError('');
  };

  const saveEditSpace = async () => {
    if (!editSpace) return;
    if (!esTitle.trim()) { setError('Space title is required.'); return; }
    setSavingEditSpace(true);
    setError('');
    try {
      const imagePath = esImage ? await uploadPublicAsset(esImage, 'spaces') : null;
      await adminUpdateSpace({
        id: editSpace.id,
        title: esTitle.trim(),
        description: esDesc.trim() || null,
        category: esCategory.trim() || null,
        orderIndex: Number(esOrder) || 0,
        imagePath,
      });
      setEditSpace(null);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update space');
    } finally {
      setSavingEditSpace(false);
    }
  };

  const openEditEvent = (ev: WebsiteEvent) => {
    setEditEvent(ev);
    setEeTitle(ev.title);
    setEeDesc(ev.description ?? '');
    setEeType(ev.type ?? '');
    setEeLoc(ev.location ?? '');
    setEeStartsAt(new Date(ev.starts_at).toISOString().slice(0, 16));
    setEeCapacity(String(ev.capacity ?? 0));
    setEePrice(ev.price ?? '');
    setEeActive(Boolean(ev.is_active));
    setEeImage(null);
    setError('');
  };

  const saveEditEvent = async () => {
    if (!editEvent) return;
    if (!eeTitle.trim()) { setError('Event title is required.'); return; }
    if (!eeStartsAt) { setError('Event start date/time is required.'); return; }
    setSavingEditEvent(true);
    setError('');
    try {
      const imagePath = eeImage ? await uploadPublicAsset(eeImage, 'events') : editEvent.image_path;
      await adminUpdateEvent({
        id: editEvent.id,
        title: eeTitle.trim(),
        description: eeDesc.trim() || null,
        startsAt: new Date(eeStartsAt).toISOString(),
        endsAt: editEvent.ends_at,
        location: eeLoc.trim() || null,
        type: eeType.trim() || null,
        imagePath,
        capacity: Number(eeCapacity) || null,
        price: eePrice.trim() || null,
        isActive: eeActive,
      });
      setEditEvent(null);
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update event');
    } finally {
      setSavingEditEvent(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={cv} className="min-h-screen bg-[#F5F5F0] lg:flex">
      <AdminSidebar />
      <main className="pt-14 lg:pt-0 lg:ml-80 flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-20 relative overflow-hidden">
        <motion.header variants={ci} className="mb-8">
          <p className="text-[#D4A373] font-black uppercase tracking-[0.3em] text-xs mb-2">Website content</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-[#1A1A1A] leading-none uppercase">
            Landing Page<br /><span className="text-[#C62828]">Manager.</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#1A1A1A]/60 font-bold max-w-2xl">
            Manage “Our Spaces” gallery and “Upcoming Events”. Event enrollments are stored and counted automatically.
          </p>
        </motion.header>

        {error && (
          <motion.div variants={ci} className="mb-6 bg-white border border-[#C62828]/20 rounded-3xl p-5">
            <p className="text-sm font-black text-[#C62828]">{error}</p>
          </motion.div>
        )}

        <motion.div variants={ci} className="mb-8 flex gap-2">
          <button onClick={() => setTab('spaces')} className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest ${tab === 'spaces' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A]/60'}`}>
            Our Spaces
          </button>
          <button onClick={() => setTab('events')} className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest ${tab === 'events' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A]/60'}`}>
            Upcoming Events
          </button>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-white rounded-3xl animate-pulse" />
            <div className="h-64 bg-white rounded-3xl animate-pulse" />
          </div>
        ) : tab === 'spaces' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <motion.div variants={ci} className="lg:col-span-5 bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#1A1A1A]/5 shadow-sm">
              <h3 className="text-xl font-black tracking-tighter text-[#1A1A1A] mb-4 uppercase">Add space</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Title</p>
                  <input value={sTitle} onChange={e => setSTitle(e.target.value)} placeholder="e.g. Main Classroom" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Category</p>
                  <input value={sCategory} onChange={e => setSCategory(e.target.value)} placeholder="e.g. Classroom" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Short description</p>
                  <textarea value={sDesc} onChange={e => setSDesc(e.target.value)} placeholder="One line about this space…" rows={3} className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none resize-none" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Order</p>
                  <input type="number" value={sOrder} onChange={e => setSOrder(e.target.value)} placeholder="0" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Image</p>
                  <input type="file" accept="image/*" onChange={e => setSImage(e.target.les?.[0] ?? null)} className="w-full" />
                </div>
                <button disabled={savingSpace} onClick={handleCreateSpace} className="w-full mt-2 bg-[#C62828] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-60">
                  {savingSpace ? 'Saving…' : 'Add space'}
                </button>
              </div>
            </motion.div>

            <motion.div variants={ci} className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {spaces.map((s) => (
                  <div key={s.id} className="bg-white rounded-3xl overflow-hidden border border-[#1A1A1A]/5 shadow-sm">
                    <div className="h-40 bg-[#F5F5F0]">
                      <img src={publicAssetUrl(s.image_path) ?? ''} alt={s.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#C62828]">{s.category ?? 'Space'}</p>
                      <p className="text-lg font-black tracking-tight text-[#1A1A1A]">{s.title}</p>
                      {s.description && <p className="text-sm text-[#1A1A1A]/60 font-bold mt-1">{s.description}</p>}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => openEditSpace(s)}
                          className="px-4 py-2 rounded-2xl bg-[#1A1A1A] text-white font-black text-[10px] uppercase tracking-widest"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => { if (!window.conrm('Delete this space?')) return; await adminDeleteSpace(s.id); await refresh(); }}
                          className="px-4 py-2 rounded-2xl bg-[#F5F5F0] text-[#C62828] font-black text-[10px] uppercase tracking-widest"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!spaces.length && <p className="text-sm font-black text-[#1A1A1A]/30 uppercase tracking-widest">No spaces yet.</p>}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <motion.div variants={ci} className="lg:col-span-5 bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#1A1A1A]/5 shadow-sm">
              <h3 className="text-xl font-black tracking-tighter text-[#1A1A1A] mb-4 uppercase">Add event</h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Title</p>
                  <input value={eTitle} onChange={e => setETitle(e.target.value)} placeholder="e.g. German Workshop" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Small description</p>
                  <textarea value={eDesc} onChange={e => setEDesc(e.target.value)} placeholder="Short teaser shown on landing page…" rows={3} className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Type</p>
                    <input value={eType} onChange={e => setEType(e.target.value)} placeholder="Workshop" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Location</p>
                    <input value={eLoc} onChange={e => setELoc(e.target.value)} placeholder="Alexandria Campus" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Start date & time</p>
                  <input type="datetime-local" value={eStartsAt} onChange={e => setEStartsAt(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Capacity</p>
                    <input type="number" value={eCapacity} onChange={e => setECapacity(e.target.value)} placeholder="25" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Price</p>
                    <input value={ePrice} onChange={e => setEPrice(e.target.value)} placeholder="Free / 15 EGP" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Image</p>
                  <input type="file" accept="image/*" onChange={e => setEImage(e.target.les?.[0] ?? null)} className="w-full" />
                </div>
                <button disabled={savingEvent} onClick={handleCreateEvent} className="w-full mt-2 bg-[#C62828] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-60">
                  {savingEvent ? 'Saving…' : 'Add event'}
                </button>
              </div>
            </motion.div>

            <motion.div variants={ci} className="lg:col-span-7 space-y-4">
              {nextEvents.map((ev) => (
                <div key={ev.id} className="bg-white rounded-3xl overflow-hidden border border-[#1A1A1A]/5 shadow-sm">
                  {ev.image_path && (
                    <div className="h-44 bg-[#F5F5F0]">
                      <img src={publicAssetUrl(ev.image_path) ?? ''} alt={ev.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#C62828]">
                          {ev.type ?? 'Event'} • {new Date(ev.starts_at).toLocaleString()}
                        </p>
                        <p className="text-2xl font-black tracking-tight text-[#1A1A1A]">{ev.title}</p>
                        {ev.description && <p className="text-sm text-[#1A1A1A]/60 font-bold mt-1">{ev.description}</p>}
                        <p className="text-xs font-black uppercase tracking-widest text-[#1A1A1A]/40 mt-3">
                          {ev.location ?? '—'} • Capacity {ev.capacity ?? 0} • Price {ev.price ?? '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A373]">Bookings</p>
                        <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{bookingCounts[ev.id] ?? 0}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditEvent(ev)}
                        className="px-4 py-2 rounded-2xl bg-[#1A1A1A] text-white font-black text-[10px] uppercase tracking-widest"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => { setSelectedEventId(ev.id === selectedEventId ? null : ev.id); }}
                        className="px-4 py-2 rounded-2xl bg-[#F5F5F0] text-[#1A1A1A] font-black text-[10px] uppercase tracking-widest"
                      >
                        {selectedEventId === ev.id ? 'Hide bookings' : 'View bookings'}
                      </button>
                      <button
                        onClick={async () => { if (!window.conrm('Delete this event?')) return; await adminDeleteEvent(ev.id); setSelectedEventId(null); await refresh(); }}
                        className="px-4 py-2 rounded-2xl bg-[#F5F5F0] text-[#C62828] font-black text-[10px] uppercase tracking-widest"
                      >
                        Delete
                      </button>
                    </div>

                    {selectedEventId === ev.id && (
                      <div className="mt-6 bg-[#F5F5F0] rounded-2xl p-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 mb-3">Bookings list</p>
                        {!eventBookings.length ? (
                          <p className="text-xs font-black text-[#1A1A1A]/30 uppercase tracking-widest">No bookings yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {eventBookings.map(b => (
                              <div key={b.id} className="bg-white rounded-2xl p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-[#1A1A1A] truncate">{b.name || '—'}</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 truncate">{b.email || '—'}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A373]">Seats</p>
                                  <p className="text-xl font-black text-[#1A1A1A]">{b.seats}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {!events.length && <p className="text-sm font-black text-[#1A1A1A]/30 uppercase tracking-widest">No events yet.</p>}
            </motion.div>
          </div>
        )}
      </main>

      {editSpace && (
        <div className="xed inset-0 z-120 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setEditSpace(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Edit space</p>
                <h3 className="text-2xl font-black tracking-tight text-[#1A1A1A]">{editSpace.title}</h3>
              </div>
              <button className="w-10 h-10 rounded-xl bg-[#F5F5F0]" onClick={() => setEditSpace(null)}>✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Title</p>
                <input value={esTitle} onChange={e => setEsTitle(e.target.value)} placeholder="Title" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Category</p>
                <input value={esCategory} onChange={e => setEsCategory(e.target.value)} placeholder="Category" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Order</p>
                <input type="number" value={esOrder} onChange={e => setEsOrder(e.target.value)} placeholder="Order" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Replace image (optional)</p>
                <input type="file" accept="image/*" onChange={e => setEsImage(e.target.les?.[0] ?? null)} className="w-full" />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Description</p>
              <textarea value={esDesc} onChange={e => setEsDesc(e.target.value)} rows={3} placeholder="Description" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none resize-none" />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditSpace(null)} className="px-5 py-3 rounded-2xl bg-[#F5F5F0] font-black text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={saveEditSpace} disabled={savingEditSpace} className="px-6 py-3 rounded-2xl bg-[#C62828] text-white font-black text-xs uppercase tracking-widest disabled:opacity-60">
                {savingEditSpace ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editEvent && (
        <div className="xed inset-0 z-120 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60" onClick={() => setEditEvent(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 border border-[#1A1A1A]/10 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.35em] text-[#D4A373]">Edit event</p>
                <h3 className="text-2xl font-black tracking-tight text-[#1A1A1A]">{editEvent.title}</h3>
              </div>
              <button className="w-10 h-10 rounded-xl bg-[#F5F5F0]" onClick={() => setEditEvent(null)}>✕</button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Title</p>
                <input value={eeTitle} onChange={e => setEeTitle(e.target.value)} placeholder="Title" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Small description</p>
                <textarea value={eeDesc} onChange={e => setEeDesc(e.target.value)} rows={3} placeholder="Small description" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Type</p>
                  <input value={eeType} onChange={e => setEeType(e.target.value)} placeholder="Type" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Location</p>
                  <input value={eeLoc} onChange={e => setEeLoc(e.target.value)} placeholder="Location" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Start date & time</p>
                <input type="datetime-local" value={eeStartsAt} onChange={e => setEeStartsAt(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Capacity</p>
                  <input type="number" value={eeCapacity} onChange={e => setEeCapacity(e.target.value)} placeholder="Capacity" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Price</p>
                  <input value={eePrice} onChange={e => setEePrice(e.target.value)} placeholder="Price" className="w-full px-4 py-3 rounded-2xl bg-[#F5F5F0] font-black text-sm outline-none" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input id="evtActive" type="checkbox" checked={eeActive} onChange={e => setEeActive(e.target.checked)} />
                <label htmlFor="evtActive" className="text-sm font-black text-[#1A1A1A]/60">Active (show on landing page)</label>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Replace image (optional)</p>
                <input type="file" accept="image/*" onChange={e => setEeImage(e.target.les?.[0] ?? null)} className="w-full" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditEvent(null)} className="px-5 py-3 rounded-2xl bg-[#F5F5F0] font-black text-xs uppercase tracking-widest">Cancel</button>
              <button onClick={saveEditEvent} disabled={savingEditEvent} className="px-6 py-3 rounded-2xl bg-[#C62828] text-white font-black text-xs uppercase tracking-widest disabled:opacity-60">
                {savingEditEvent ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

