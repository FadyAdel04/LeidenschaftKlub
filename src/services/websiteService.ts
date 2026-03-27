import { supabase } from '../lib/supabase';
// Admin notifications for bookings are inserted via RPC (see `notify_admins`)

export type WebsiteSpace = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_path: string;
  order_index: number;
};

export type WebsiteEvent = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  type: string | null;
  image_path: string | null;
  capacity: number | null;
  price: string | null;
  is_active: boolean;
};

export type WebsiteBooking = {
  id: string;
  event_id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  seats: number;
  created_at: string;
};

export async function fetchWebsiteSpaces(): Promise<WebsiteSpace[]> {
  const { data, error } = await supabase
    .from('website_spaces')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WebsiteSpace[];
}

export async function fetchWebsiteEvents(): Promise<WebsiteEvent[]> {
  const { data, error } = await supabase
    .from('website_events')
    .select('*')
    .eq('is_active', true)
    .order('starts_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WebsiteEvent[];
}

export async function bookWebsiteEvent(payload: {
  eventId: string;
  userId?: string | null;
  name: string;
  email: string;
  seats: number;
}): Promise<void> {
  // IMPORTANT:
  // - Anonymous users can insert bookings but cannot SELECT them back (RLS), so don't request `select` unless logged in.
  // - Authenticated users can SELECT their own booking rows (policy: owner read).
  let bookingId: string | null = null;

  if (payload.userId) {
    const { data: bookingRow, error } = await supabase
      .from('website_event_bookings')
      .insert({
        event_id: payload.eventId,
        user_id: payload.userId ?? null,
        name: payload.name,
        email: payload.email,
        seats: payload.seats,
      })
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    bookingId = (bookingRow as { id: string }).id;
  } else {
    const { error } = await supabase.from('website_event_bookings').insert({
      event_id: payload.eventId,
      user_id: null,
      name: payload.name,
      email: payload.email,
      seats: payload.seats,
    });
    if (error) throw new Error(error.message);
  }

  // Notify admins about booking (student -> admin)
  try {
    const studentId = payload.userId;
    if (!studentId) return;
    const { data: ev } = await supabase
      .from('website_events')
      .select('title')
      .eq('id', payload.eventId)
      .maybeSingle();
    const eventTitle = (ev as { title?: string } | null)?.title ?? 'Event';
    if (!bookingId) return;

    await supabase.rpc('notify_admins', {
      p_type: 'event',
      p_title: 'New event booking',
      p_message: `${eventTitle} — booking confirmed`,
      p_related_id: bookingId,
      p_priority: 'medium',
    });
  } catch {
    // Notifications must never block booking.
  }
}

export function publicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('public-assets').getPublicUrl(path);
  return data.publicUrl;
}

