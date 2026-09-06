// Bookhub — shared frontend data and UI helpers.
import { supabase } from './supabaseClient.js';

export async function saveInterests(userId, categories, formats) {
  if (!userId) return { data: null, error: new Error('A signed-in user is required to save interests.') };
  const { data, error } = await supabase
    .from('profiles')
    .update({ selected_categories: categories, selected_formats: formats })
    .eq('id', userId)
    .select()
    .single();
  if (error) console.error('Could not save interests:', error.message);
  return { data, error };
}

export async function searchLibrary(query = '') {
  const term = query.trim();
  let request = supabase.from('books').select('*').order('created_at', { ascending: false });
  if (term) request = request.or(`title.ilike.%${term}%,author.ilike.%${term}%,description.ilike.%${term}%`);
  const { data, error } = await request;
  if (error) {
    console.error('Search failed:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getFeaturedBooks(limit = 4) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Could not load featured books:', error.message);
    return [];
  }
  return data ?? [];
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

export function formatLabel(value = 'ebook') {
  return String(value).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
