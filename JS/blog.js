/**
 * m0sen.ir - Shamsi Date & Summary Trimmer (v1.0.2)
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Shamsi Date Conversion
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

  // 2. Clean Text Summaries on Home / Archive page
  const summaryContainers = document.querySelectorAll('[data-summary="true"]');
  summaryContainers.forEach(container => {
    // Strip heavy elements from summary preview
    const rawText = container.textContent.trim().replace(/\s+/g, ' ');
    if (rawText.length > 220) {
      container.textContent = rawText.slice(0, 220) + '...';
    } else {
      container.textContent = rawText;
    }
  });
});
