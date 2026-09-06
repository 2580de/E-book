// Bookhub — shared frontend data and UI helpers.
import { supabase } from './supabase.js';

export async function saveInterests(userId, categories, formats) {
  // The current live profiles table does not yet contain preference columns.
  // Keep preferences local until an authenticated profile migration is introduced.
  const preferences = { userId: userId ?? null, categories, formats, savedAt: new Date().toISOString() };
  localStorage.setItem('bookhubPreferences', JSON.stringify(preferences));
  return { data: preferences, error: null };
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
  const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) {
    console.error('Could not load featured books:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getBook(id) {
  if (!id) return null;
  const { data, error } = await supabase.from('books').select('*').eq('id', id).single();
  if (error) {
    console.error('Could not load book:', error.message);
    return null;
  }
  return data;
}

export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

export function formatLabel(value = 'ebook') {
  return String(value).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function bookCard(book) {
  const id = encodeURIComponent(book.id ?? '');
  const cover = book.cover_image_url ? `<img src="${escapeHtml(book.cover_image_url)}" alt="" loading="lazy">` : '';
  return `<article class="book-card"><a href="book?id=${id}" class="book-link"><div class="book-cover">${cover}<span class="fmt-tag">${escapeHtml(formatLabel(book.format))}</span></div><h3 class="book-title">${escapeHtml(book.title)}</h3><p class="book-author">${escapeHtml(book.author ?? 'Unknown author')}</p></a></article>`;
}

export function resultRow(book) {
  const id = encodeURIComponent(book.id ?? '');
  return `<article class="result-row"><div class="spine"></div><div><a class="r-title" href="book?id=${id}">${escapeHtml(book.title)}</a><p class="r-meta"><span class="fmt">${escapeHtml(formatLabel(book.format))}</span>${escapeHtml(book.author ?? 'Unknown author')}${book.category ? ` · ${escapeHtml(book.category)}` : ''}</p></div><a class="r-action" href="book?id=${id}">View</a></article>`;
}

export async function mountHome() {
  const shelf = document.querySelector('#featured-books');
  if (!shelf) return;
  const books = await getFeaturedBooks(4);
  shelf.innerHTML = books.length ? books.map(bookCard).join('') : '<p class="empty-state">No books have been added yet. Add books in Supabase and they will appear here.</p>';
}

export async function mountSearch() {
  const form = document.querySelector('#library-search');
  const input = document.querySelector('#q2');
  const shelf = document.querySelector('#search-results');
  const count = document.querySelector('#search-count');
  if (!form || !input || !shelf) return;
  input.value = new URLSearchParams(window.location.search).get('q') ?? '';
  const run = async () => {
    const books = await searchLibrary(input.value);
    shelf.innerHTML = books.length ? books.map(resultRow).join('') : '<p class="empty-state">No matching books found.</p>';
    if (count) count.textContent = books.length;
  };
  await run();
  form.addEventListener('submit', event => { event.preventDefault(); const url = new URL(window.location); url.searchParams.set('q', input.value.trim()); history.replaceState({}, '', url); run(); });
}

export async function mountBook() {
  const id = new URLSearchParams(window.location.search).get('id');
  const root = document.querySelector('#book-detail');
  if (!root || !id) return;
  const book = await getBook(id);
  if (!book) { root.innerHTML = '<p class="empty-state">Book not found.</p>'; return; }
  root.innerHTML = `<div class="book-detail-cover">${book.cover_image_url ? `<img src="${escapeHtml(book.cover_image_url)}" alt="Cover of ${escapeHtml(book.title)}">` : ''}</div><div><p class="hero-eyebrow">${escapeHtml(formatLabel(book.format))}</p><h1>${escapeHtml(book.title)}</h1><p class="book-author">${escapeHtml(book.author ?? 'Unknown author')}</p><p>${escapeHtml(book.description ?? 'No description available yet.')}</p>${book.content_url ? `<a class="btn btn-amber" href="${escapeHtml(book.content_url)}" target="_blank" rel="noopener">Open content</a>` : ''}</div>`;
}

document.addEventListener('DOMContentLoaded', () => { mountHome(); mountSearch(); mountBook(); });
