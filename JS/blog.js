/**
 * m0sen.ir - Blog Engine (v1.0.5)
 * Date Format: YYYY/MM/DD (Gregorian)
 */

// Helper to convert Persian/Arabic digits to English digits
const toEnglishDigits = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776)
    .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632);
};

// Formats a Date object to "YYYY/MM/DD"
const formatGregorianYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
};

// Gregorian month names mapping for parsing Blogger raw strings
const gregorianMonthMap = {
  // English
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3, april: 4, apr: 4,
  may: 5, june: 6, jun: 6, july: 7, jul: 7, august: 8, aug: 8,
  september: 9, sep: 9, sept: 9, october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12,
  // Persian transliterated Gregorian months
  'ژانویه': 1, 'فوریه': 2, 'مارس': 3, 'آوریل': 4, 'مه': 5, 'می': 5, 'ژوئن': 6,
  'ژوئیه': 7, 'جولای': 7, 'اوت': 8, 'آگوست': 8, 'سپتامبر': 9, 'اکتبر': 10, 'نوامبر': 11, 'دسامبر': 12
};

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------------
  // 1. Gregorian Post Dates Formatter (YYYY/MM/DD e.g. 2008/12/17)
  // -------------------------------------------------------------
  const dateElements = document.querySelectorAll('.post-date');
  dateElements.forEach(el => {
    const raw = toEnglishDigits(el.textContent.trim());
    if (!raw) return;

    // Check if directly parseable by JS Date (ISO, RFC2822, etc.)
    const directDate = new Date(raw);
    if (!isNaN(directDate.getTime()) && directDate.getFullYear() > 1990) {
      el.textContent = formatGregorianYMD(directDate);
      return;
    }

    // Try parsing strings containing month names (e.g., "سپتامبر 11, 2026" or "11 September 2026")
    const lower = raw.toLowerCase();
    for (const [mName, mVal] of Object.entries(gregorianMonthMap)) {
      if (lower.includes(mName)) {
        const numbers = raw.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          const year = numbers.find(n => n.length === 4) || numbers[numbers.length - 1];
          const day = numbers.find(n => n !== year) || '1';
          const y = parseInt(year, 10);
          const m = String(mVal).padStart(2, '0');
          const d = String(parseInt(day, 10)).padStart(2, '0');
          el.textContent = `${y}/${m}/${d}`;
          return;
        }
      }
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
    const callbackName = 'onLabelsFeed_' + Math.floor(Math.random() * 100000);
    
    window[callbackName] = function(data) {
      const categories = data?.feed?.category || [];
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

      delete window[callbackName];
      const scriptNode = document.getElementById(callbackName);
      if (scriptNode) scriptNode.remove();
    };

    const script = document.createElement('script');
    script.id = callbackName;
    script.src = `/feeds/posts/default?alt=json-in-script&callback=${callbackName}&max-results=0`;
    document.body.appendChild(script);
  }

  // -------------------------------------------------------------
  // 4. Archives Formatter (YYYY/MM e.g. "2026/09")
  // -------------------------------------------------------------
  const archiveLinks = document.querySelectorAll('#archivesList a');
  archiveLinks.forEach(link => {
    const raw = toEnglishDigits(link.textContent.trim().toLowerCase());
    for (const [mName, mVal] of Object.entries(gregorianMonthMap)) {
      if (raw.includes(mName)) {
        const yearMatch = raw.match(/\d{4}/);
        if (yearMatch) {
          const y = yearMatch[0];
          const m = String(mVal).padStart(2, '0');
          link.textContent = `${y}/${m}`;
        }
        break;
      }
    }
  });

});
