import { supabase } from '../lib/supabase';
import type { WebsiteBooking, WebsiteEvent, WebsiteSpace } from './websiteService';

export type { WebsiteSpace, WebsiteEvent, WebsiteBooking };

function slugSafeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    const loaded = await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Invalid image'));
      img.src = url;
    });
    void loaded;
    return { width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadPublicAsset(file: File, folder: 'spaces' | 'events'): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please upload an image file.');
  const { width, height } = await getImageDimensions(file);
  if (width < 1200 || height < 800) {
    throw new Error(`Image is too small (${width}x${height}). Please upload at least 1200x800 for good quality.`);
  }

  const ext = file.name.split('.').pop() || 'bin';
  const base = slugSafeName(file.name.replace(/\.[^/.]+$/, '')) || 'asset';
  const path = `${folder}/${Date.now()}_${base}.${ext}`;
  const { error } = await supabase.storage.from('public-assets').upload(path, file, {
    upsert: true,
    contentType: file.type,
    cacheControl: '3600',
  });
  if (error) throw new Error(error.message);
  return path;
}

// Spaces (Our Spaces)
export async function adminFetchSpaces(): Promise<WebsiteSpace[]> {
  const { data, error } = await supabase
    .from('website_spaces')
    .select('*')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WebsiteSpace[];
}

export async function adminCreateSpace(payload: {
  title: string;
  description?: string | null;
  category?: string | null;
  imagePath: string;
  orderIndex?: number;
}): Promise<void> {
  const { error } = await supabase.from('website_spaces').insert({
    title: payload.title,
    description: payload.description ?? null,
    category: payload.category ?? null,
    image_path: payload.imagePath,
    order_index: payload.orderIndex ?? 0,
  });
  if (error) throw new Error(error.message);
}

export async function adminUpdateSpace(payload: {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  imagePath?: string | null;
  orderIndex?: number;
}): Promise<void> {
  const updates: Record<string, unknown> = {
    title: payload.title,
    description: payload.description ?? null,
    category: payload.category ?? null,
  };
  if (typeof payload.orderIndex === 'number') updates.order_index = payload.orderIndex;
  if (payload.imagePath) updates.image_path = payload.imagePath;
  const { error } = await supabase.from('website_spaces').update(updates).eq('id', payload.id);
  if (error) throw new Error(error.message);
}

export async function adminDeleteSpace(id: string): Promise<void> {
  const { error } = await supabase.from('website_spaces').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// Events
export async function adminFetchEvents(): Promise<WebsiteEvent[]> {
  const { data, error } = await supabase
    .from('website_events')
    .select('*')
    .order('starts_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WebsiteEvent[];
}

export async function adminCreateEvent(payload: {
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  type?: string | null;
  imagePath?: string | null;
  capacity?: number | null;
  price?: string | null;
  isActive?: boolean;
}): Promise<void> {
  const { error } = await supabase.from('website_events').insert({
    title: payload.title,
    description: payload.description ?? null,
    starts_at: payload.startsAt,
    ends_at: payload.endsAt ?? null,
    location: payload.location ?? null,
    type: payload.type ?? null,
    image_path: payload.imagePath ?? null,
    capacity: payload.capacity ?? null,
    price: payload.price ?? null,
    is_active: payload.isActive ?? true,
  });
  if (error) throw new Error(error.message);
}

export async function adminUpdateEvent(payload: {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  type?: string | null;
  imagePath?: string | null;
  capacity?: number | null;
  price?: string | null;
  isActive?: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from('website_events')
    .update({
      title: payload.title,
      description: payload.description ?? null,
      starts_at: payload.startsAt,
      ends_at: payload.endsAt ?? null,
      location: payload.location ?? null,
      type: payload.type ?? null,
      image_path: payload.imagePath ?? null,
      capacity: payload.capacity ?? null,
      price: payload.price ?? null,
      is_active: payload.isActive ?? true,
    })
    .eq('id', payload.id);
  if (error) throw new Error(error.message);
}

export async function adminDeleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('website_events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function adminFetchEventBookings(eventId: string): Promise<WebsiteBooking[]> {
  const { data, error } = await supabase
    .from('website_event_bookings')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as WebsiteBooking[];
}

export async function adminFetchEventBookingCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('website_event_bookings')
    .select('event_id, seats');
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ event_id: string; seats: number }>) {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + (row.seats ?? 0);
  }
  return counts;
}

