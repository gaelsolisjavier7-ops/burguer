/**
 * UI.JS - Lógica de Interfaz de Usuario (Temas, Modales, Navegación)
 */

export function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || 
         localStorage.getItem('bhd_theme') || 
         'dark';
}

export function applyTheme(theme, notify = false, showToast = null) {
  const isLight = (theme === 'light');
  const targetTheme = isLight ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', targetTheme);
  try {
    localStorage.setItem('bhd_theme', targetTheme);
  } catch (e) {}

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');
  const themeTooltip = document.getElementById('theme-tooltip');
  const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle-btn');
  const mobileThemeIcon = document.getElementById('mobile-theme-icon');
  const mobileThemeLabel = document.getElementById('mobile-theme-label');

  if (themeToggleBtn && themeToggleIcon) {
    if (isLight) {
      themeToggleBtn.setAttribute('aria-label', 'Cambiar a modo oscuro');
      themeToggleBtn.setAttribute('title', 'Cambiar a modo oscuro (Noche)');
      themeToggleIcon.className = 'fa-solid fa-moon';
      if (themeTooltip) themeTooltip.textContent = 'Modo Oscuro';
    } else {
      themeToggleBtn.setAttribute('aria-label', 'Cambiar a modo claro');
      themeToggleBtn.setAttribute('title', 'Cambiar a modo claro (Día)');
      themeToggleIcon.className = 'fa-solid fa-sun';
      if (themeTooltip) themeTooltip.textContent = 'Modo Claro';
    }
  }

  if (mobileThemeToggleBtn) {
    if (isLight) {
      mobileThemeToggleBtn.setAttribute('aria-label', 'Cambiar a modo oscuro');
      if (mobileThemeIcon) mobileThemeIcon.className = 'fa-solid fa-moon';
      if (mobileThemeLabel) mobileThemeLabel.textContent = 'Cambiar a Modo Oscuro';
    } else {
      mobileThemeToggleBtn.setAttribute('aria-label', 'Cambiar a modo claro');
      if (mobileThemeIcon) mobileThemeIcon.className = 'fa-solid fa-sun';
      if (mobileThemeLabel) mobileThemeLabel.textContent = 'Cambiar a Modo Claro';
    }
  }

  if (notify && showToast) {
    showToast(isLight ? '☀️ Modo Claro activado' : '🌙 Modo Oscuro activado');
  }
}

export function toggleTheme(showToast = null) {
  const current = getCurrentTheme();
  const nextTheme = (current === 'light') ? 'dark' : 'light';
  applyTheme(nextTheme, true, showToast);
}

const REVEAL_SELECTOR = '.scroll-reveal, .section-reveal, .scroll-fade-item, .pin-card, .product-card, .step-card, .feature-item, .coverage-map-card';

let scrollObserver = null;

export function initScrollAnimations() {
  const isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isReducedMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }

  if (scrollObserver) {
    scrollObserver.disconnect();
  }

  scrollObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -35px 0px',
    threshold: 0.05
  });

  observeScrollElements(document);

  // Revelar de inmediato lo que ya está en el viewport al cargar
  setTimeout(() => {
    document.querySelectorAll(REVEAL_SELECTOR + ':not(.is-visible)').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 60 && rect.bottom > -30) {
        el.classList.add('is-visible');
        if (scrollObserver) scrollObserver.unobserve(el);
      }
    });
  }, 150);
}

export function observeScrollElements(container = document) {
  if (!scrollObserver) {
    container.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
      el.classList.add('is-visible');
    });
    return;
  }

  const elements = container.querySelectorAll(REVEAL_SELECTOR);
  elements.forEach((el, index) => {
    if (!el.style.getPropertyValue('--fade-idx')) {
      el.style.setProperty('--fade-idx', (index % 6));
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 20 && rect.bottom > 0) {
      // Ya está en el viewport: pequeña pausa para el efecto escalonado
      setTimeout(() => {
        el.classList.add('is-visible');
      }, (index % 6) * 45);
    } else {
      scrollObserver.observe(el);
    }
  });
}
