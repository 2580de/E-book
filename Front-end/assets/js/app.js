import { supabase } from './supabaseClient.js';

const state = {
  profile: null,
  online: navigator.onLine,
};

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  listener(state);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((listener) => listener(state));
  window.dispatchEvent(new CustomEvent('bookhub:state', { detail: state }));
}

function setOnline(value) {
  state.online = value;
  emit();
}

window.addEventListener('online', () => setOnline(true));
window.addEventListener('offline', () => setOnline(false));

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function loadProfile(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, selected_categories, selected_formats')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  state.profile = data;
  emit();
  return data;
}

export async function saveInterests(userId, categories, formats) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const payload = {
    id: userId,
    selected_categories: [...new Set(categories)],
    selected_formats: [...new Set(formats)],
  };
  const { data, error } = await supabase.from('profiles').upsert(payload).select().single();
  if (error) throw error;
  state.profile = data;
  emit();
  return data;
}

export async function searchLibrary(query, { limit = 30 } = {}) {
  if (!supabase || !query?.trim()) return [];
  const term = query.trim().replaceAll(',', ' ');
  const { data, error } = await supabase
    .from('books')
    .select('id,title,author,category,format,cover_url,blurb')
    .or(`title.ilike.%${term}%,author.ilike.%${term}%,category.ilike.%${term}%`)
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getFeaturedBooks(limit = 8) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('books')
    .select('id,title,author,category,format,cover_url,blurb')
    .order('title', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function trackActivity({ userId, activityType, targetType = null, targetId = null, metadata = {} }) {
  if (!supabase || !userId) return;
  const { error } = await supabase.from('user_activity').insert({
    user_id: userId,
    activity_type: activityType,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
  if (error) console.warn('Activity sync failed:', error.message);
}

export function watchProfile(userId, onChange) {
  if (!supabase || !userId) return () => {};
  const channel = supabase
    .channel(`profile:${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${userId}`,
    }, (payload) => {
      state.profile = payload.new ?? null;
      emit();
      onChange?.(state.profile, payload);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function bootstrapAuth() {
  if (!supabase) return null;
  const session = await getSession();
  if (session?.user) await loadProfile(session.user.id);

  supabase.auth.onAuthStateChange(async (_event, nextSession) => {
    if (nextSession?.user) await loadProfile(nextSession.user.id);
    else {
      state.profile = null;
      emit();
    }
  });

  return session;
}

// Start synchronization when app.js is loaded.
bootstrapAuth().catch((error) => console.warn('Bookhub auth bootstrap:', error.message));
