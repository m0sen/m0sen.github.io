/**
 * m0sen.ir - Dynamic Engine (v1.0.4)
 */

// Helper to convert Persian/Arabic digits to English digits
const toEnglishDigits = (str) => {
  if (!str) return '';
  return str.replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776)
            .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632);
};

// Shamsi Formatter to exact format: "۱۱ شهریور ۱۴۰۵"
const formatToShamsiDayMonthYear = (date) => {
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

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------------
  // 1. Shamsi Post Dates Formatter (Resolves "چهارشنبه, شهریور ۱۱, ۱۴۰۵" -> "۱۱ شهریور ۱۴۰۵")
  // -------------------------------------------------------------
  const dateElements = document.querySelectorAll('.post-date');
  const persianMonthsList = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

  dateElements.forEach(el => {
    const rawText = el.textContent.trim();
    if (!rawText) return;

    // Check if it's already a Persian date string like "چهارشنبه, شهریور ۱۱, ۱۴۰۵"
    const cleanedText = toEnglishDigits(rawText);
    const foundMonth = persianMonthsList.find(m => rawText.includes(m));

    if (foundMonth) {
      // Extract numbers for day and year
      const numbers = cleanedText.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        // usually [11, 1405]
        const day = numbers[0];
        const year = numbers[1].length === 4 ? numbers[1] : (numbers[0].length === 4 ? numbers[0] : numbers[1]);
        const actualDay = (day === year) ? numbers[1] : day;
        
        // Convert numbers back to Persian digits
        const faDay = new Intl.NumberFormat('fa-IR').format(parseInt(actualDay, 10));
        const faYear = new Intl.NumberFormat('fa-IR', { useGrouping: false }).format(parseInt(year, 10));
        
        el.textContent = `${faDay} ${foundMonth} ${faYear}`;
        return;
      }
    }

    // Fallback: standard date parsing
    try {
      const parsed = new Date(rawText);
      if (!isNaN(parsed.getTime())) {
        el.textContent = formatToShamsiDayMonthYear(parsed);
      }
    } catch (e) {
      // Keep original if failed
    }
  });

  // -------------------------------------------------------------
  // 2. Summary Trimmer + Inline Read More Link
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 3. Dynamic Labels Loader via Blogger JSON Feed API
  // -------------------------------------------------------------
  const labelsCloud = document.getElementById('dynamicLabelsCloud');
  if (labelsCloud) {
    const feedCallbackName = 'onBloggerLabelsLoaded_' + Math.floor(Math.random() * 10000);
    
    window[feedCallbackName] = function(root) {
      const categories = root?.feed?.category || [];
      const labelMap = new Map();

      categories.forEach(cat => {
        const term = cat.term?.trim();
        if (term && !labelMap.has(term)) {
          labelMap.set(term, `/search/label/${encodeURIComponent(term)}`);
        }
      });

      if (labelMap.size > 0) {
        labelsCloud.innerHTML = '';
        labelMap.forEach((url
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

  // -------------------------------------------------------------
  // 3. Dynamic Labels Loader via Blogger JSON Feed API
  // -------------------------------------------------------------
  const labelsCloud = document.getElementById('dynamicLabelsCloud');
  if (labelsCloud) {
    const feedCallbackName = 'onBloggerLabelsLoaded_' + Math.floor(Math.random() * 10000);
    
    window[feedCallbackName] = function(root) {
      const categories = root?.feed?.category || [];
      const labelMap = new Map();

      categories.forEach(cat => {
        const term = cat.term?.trim();
        if (term && !labelMap.has(term)) {
          labelMap.set(term, `/search/label/${encodeURIComponent(term)}`);
        }
      });

      if (labelMap.size > 0) {
        labelsCloud.innerHTML = '';
        labelMap.forEach((url, name) => {
          const a = document.createElement('a');
          a.href = url;
          a.textContent = name;
          labelsCloud.appendChild(a);
        });
      } else {
        labelsCloud.innerHTML = '<span style="color:var(--text-sub);font-size:0.8rem;">برچسبی یافت نشد</span>';
      }

      // Cleanup
      delete windowامبر': 10, 'دسامبر': 11
  };

  const archiveLinks = document.querySelectorAll('#archivesList a');
  archiveLinks.forEach(link => {
    const rawText = toEnglishDigits(link.textContent.trim().toLowerCase());
    
    for (const [mName, mIndex] of Object.entries(gregorianMonths)) {
      if (rawText.includes(mName)) {
        const yearMatch = rawText.match(/\d{4}/);
        if (yearMatch) {
          const year = parseInt(yearMatch[0], 10);
          const approxDate = new Date(year, mIndex, 15);
          
          const shamsiFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
            month: 'long',
            year: 'numeric'
          });
          link.textContent = shamsiFormatter.format(approxDate);
        }
        break;
      }
    }
  });

});
