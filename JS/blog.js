/**
 * m0sen.ir - Dynamic Engine (v1.0.3)
 */
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Shamsi Date Formatter (Format: "۱۲ شهریور ۱۴۰۵")
  const formatToPersianParts = (date) => {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const year = parts.find(p => p.type === 'year')?.value || '';
    return `${day} ${month} ${year}`.trim();
  };

  const dateElements = document.querySelectorAll('.post-date[data-iso]');
  dateElements.forEach(el => {
    const raw = el.getAttribute('data-iso');
    if (!raw) return;
    try {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        el.textContent = formatToPersianParts(parsed);
      }
    } catch (e) {
      console.warn('Date parsing fallback:', e);
    }
  });

  // 2. Summary Trimmer + Inline Read More Link
  const summaryContainers = document.querySelectorAll('[data-summary="true"]');
  summaryContainers.forEach(container => {
    const permalink = container.getAttribute('data-url') || '#';
    const rawText = container.textContent.trim().replace(/\s+/g, ' ');
    const snippetLimit = 220;

    let truncated = rawText;
    if (rawText.length > snippetLimit) {
      truncated = rawText.slice(0, snippetLimit) + '...';
    }

    container.innerHTML = `${truncated} <a href="${permalink}" class="inline-readmore">ادامه مطلب ←</a>`;
  });

  // 3. Dynamic Labels Collector for Sidebar
  const labelsCloud = document.getElementById('dynamicLabelsCloud');
  if (labelsCloud) {
    const uniqueLabels = new Map();
    // Scan all labels in page
    document.querySelectorAll('.hidden-post-labels a, .post-tags a').forEach(tag => {
      const name = tag.textContent.trim();
      const href = tag.getAttribute('href');
      if (name && href && !uniqueLabels.has(name)) {
        uniqueLabels.set(name, href);
      }
    });

    if (uniqueLabels.size > 0) {
      labelsCloud.innerHTML = '';
      uniqueLabels.forEach((url, name) => {
        const a = document.createElement('a');
        a.href = url;
        a.textContent = name;
        labelsCloud.appendChild(a);
      });
    } else {
      labelsCloud.innerHTML = '<span style="color:var(--text-sub);font-size:0.8rem;">برچسبی یافت نشد</span>';
    }
  }

  // 4. Shamsi Conversion for Archives List (e.g., September 2026 -> شهریور ۱۴۰۵)
  const monthMap = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };

  const archiveLinks = document.querySelectorAll('#archivesList a');
  archiveLinks.forEach(link => {
    const text = link.textContent.trim().toLowerCase();
    const parts = text.split(/\s+/);
    if (parts.length >= 2) {
      const monthName = parts[0];
      const year = parseInt(parts[1], 10);

      if (monthMap[monthName] !== undefined && !isNaN(year)) {
        // Middle of the month to safely convert month/year
        const approxDate = new Date(year, monthMap[monthName], 15);
        const shamsiMonthYearFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
          month: 'long',
          year: 'numeric'
        });
        link.textContent = shamsiMonthYearFormatter.format(approxDate);
      }
    }
  });

});
