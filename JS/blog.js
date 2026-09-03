/**
 * m0sen.ir - Sidebar Drawer & Shamsi Date Engine
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Sidebar Drawer Toggle
  const menuBtn = document.getElementById('menuToggle');
  const closeBtn = document.getElementById('closeSidebar');
  const sidebar = document.getElementById('sidebarDrawer');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      closeSidebar();
    }
  });

  // 2. Client-Side Shamsi Date Formatter
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
      console.warn('Date parsing fallback:', e);
    }
  });
});
