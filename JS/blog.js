/**
 * m0sen.ir - Shamsi Date Engine
 */
document.addEventListener('DOMContentLoaded', () => {
  const dateElements = document.querySelectorAll('.post-date[data-iso]');
  const shamsiFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  dateElements.forEach(el => {
    const raw = el.getAttribute('data-iso');
    if (!raw) return;

    try {
      const parsed = new Date(raw);
      if (!isNaN(parsed)) {
        el.textContent = shamsiFormatter.format(parsed);
      }
    } catch (e) {
      console.warn('Date formatting fallback:', e);
    }
  });
});
