/**
 * m0sen.ir - Shamsi Date Converter for Blogger Classic
 */
document.addEventListener('DOMContentLoaded', () => {
  const dateElements = document.querySelectorAll('.post-date[data-iso]');

  const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  dateElements.forEach(el => {
    const rawDate = el.getAttribute('data-iso');
    if (!rawDate) return;

    try {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate)) {
        el.textContent = formatter.format(parsedDate);
        el.classList.add('shamsi-date');
      }
    } catch (e) {
      console.warn('Date parsing fallback:', e);
    }
  });
});
