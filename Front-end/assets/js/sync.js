const STORAGE_KEY = 'bookhub:ui:v2';
let timer;

export function readLocalState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function writeLocalState(patch) {
  const next = { ...readLocalState(), ...patch, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('bookhub:local-state', { detail: next }));
  return next;
}

export function syncAcrossTabs() {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    window.dispatchEvent(new CustomEvent('bookhub:local-state', { detail: readLocalState() }));
  });
}

export function debounce(fn, wait = 180) {
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
