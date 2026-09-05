const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
}

export function setBusy(element, busy, label = 'Working…') {
  if (!element) return;
  if (busy) {
    element.dataset.originalLabel = element.textContent;
    element.textContent = label;
    element.disabled = true;
    element.setAttribute('aria-busy', 'true');
  } else {
    element.textContent = element.dataset.originalLabel ?? element.textContent;
    element.disabled = false;
    element.removeAttribute('aria-busy');
  }
}

export function reveal(selector = '[data-reveal]') {
  const elements = document.querySelectorAll(selector);
  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  elements.forEach((el) => observer.observe(el));
}

export function announce(message) {
  let region = document.getElementById('live-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'live-region';
    region.className = 'sr-only';
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  region.textContent = message;
}
