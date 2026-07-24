// ============================================================
// Bookhub — app logic
// Stubbed functions. Wire these up once Supabase tables exist.
// Suggested tables (see README.md for schema):
//   profiles(id, selected_categories text[], selected_formats text[])
//   books(id, title, author, category, format, cover_url, blurb)
//   articles(id, title, kind, published_at, url)
// ============================================================

import { supabase } from './supabaseClient.js';

// --- categories.html: save a user's chosen interests -------
export async function saveInterests(userId, categories, formats) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, selected_categories: categories, selected_formats: formats });

  if (error) console.error('Could not save interests:', error.message);
  return data;
}

// --- search.html: query books/articles by keyword ----------
export async function searchLibrary(query) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .ilike('title', `%${query}%`);

  if (error) {
    console.error('Search failed:', error.message);
    return [];
  }
  return data;
}

// --- index.html: fetch picks for the home feed --------------
export async function getFeaturedBooks(limit = 4) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .limit(limit);

  if (error) {
    console.error('Could not load featured books:', error.message);
    return [];
  }
  return data;
}
