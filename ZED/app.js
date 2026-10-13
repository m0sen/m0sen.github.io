(function () {
  'use strict';

  /* ---------- ارجاع به عناصر DOM ---------- */
  const $ = (sel) => document.querySelector(sel);
  const inputLinks = $('#inputLinks');
  const renamePrefix = $('#renamePrefix');
  const enableRename = $('#enableRename');
  const renameBody = $('#renameBody');
  const enableEch = $('#enableEch');
  const echBody = $('#echBody');
  const echValue = $('#echValue');
  const removeFragment = $('#removeFragment');
  const processBtn = $('#processBtn');
  const outputLinks = $('#outputLinks');
  const copyBtn = $('#copyBtn');
  const downloadBtn = $('#downloadBtn');
  const inputStats = $('#inputStats');
  const outputStats = $('#outputStats');
  const errorCard = $('#errorCard');
  const errorList = $('#errorList');

  /* ---------- پروتکل‌های پشتیبانی‌شده ---------- */
  const SUPPORTED_SCHEMES = ['vless://', 'trojan://', 'vmess://', 'ss://'];

  /**
   * بررسی اینکه یک خط، لینک کانفیگ قابل شناسایی است یا خیر.
   */
  function isConfigLink(line) {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return SUPPORTED_SCHEMES.some((s) => trimmed.toLowerCase().startsWith(s));
  }

  /**
   * تجزیهٔ لینک به اجزای تشکیل‌دهنده:
   *   { scheme، schemeAndAuthority، query، fragment، basePart، raw }
   * در صورت نامعتبر بودن، مقدار null برگردانده می‌شود.
   */
  function parseLink(line) {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // جدا کردن Fragment (بخش بعد از #)
    const hashIdx = trimmed.indexOf('#');
    const basePart = hashIdx >= 0 ? trimmed.slice(0, hashIdx) : trimmed;
    const fragment = hashIdx >= 0 ? trimmed.slice(hashIdx + 1) : '';

    // جدا کردن Query (بخش بعد از ?)
    const qIdx = basePart.indexOf('?');
    const schemeAndAuthority = qIdx >= 0 ? basePart.slice(0, qIdx) : basePart;
    const query = qIdx >= 0 ? basePart.slice(qIdx + 1) : '';

    // اعتبارسنجی ساختار scheme://authority
    const schemeMatch = schemeAndAuthority.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\//);
    if (!schemeMatch) return null;

    const scheme = schemeMatch[1].toLowerCase();
    if (!SUPPORTED_SCHEMES.includes(scheme + '://')) return null;

    // بخش authority باید محتوا داشته باشد
    const authority = schemeAndAuthority.slice(schemeMatch[0].length);
    if (!authority || authority.length < 1) return null;

    return {
      scheme: scheme + '://',
      schemeAndAuthority,
      query,
      fragment,
      basePart,
      raw: trimmed,
    };
  }

  /**
   * تجزیهٔ رشتهٔ Query به آرایه‌ای از پارامترها.
   * ترتیب و کدگذاری اصلی حفظ می‌شود.
   */
  function parseQuery(query) {
    if (!query) return [];
    return query.split('&').filter(Boolean).map((pair) => {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) {
        return { key: pair, value: '', raw: pair };
      }
      return {
        key: pair.slice(0, eqIdx),
        value: pair.slice(eqIdx + 1),
        raw: pair,
      };
    });
  }

  /**
   * تبدیل آرایهٔ پارامترها به رشتهٔ Query.
   */
  function serializeQuery(params) {
    return params.map((p) => p.raw).join('&');
  }

  /**
   * ساخت لینک نهایی از اجزای تجزیه‌شده.
   */
  function buildLink(parsed, newFragment, extraQueryParams) {
    let queryStr = parsed.query;
    if (extraQueryParams && extraQueryParams.length > 0) {
      const baseParams = parseQuery(queryStr);
      const merged = baseParams.concat(extraQueryParams);
      queryStr = serializeQuery(merged);
    }

    let result = parsed.schemeAndAuthority;
    if (queryStr) result += '?' + queryStr;
    if (newFragment) result += '#' + newFragment;
    return result;
  }

  /* ---------- پردازش اصلی ---------- */
  function process() {
    const rawInput = inputLinks.value;
    const lines = rawInput.split('\n');

    const nonEmptyLines = lines.filter((l) => l.trim() !== '');
    const validLines = [];
    const invalidLines = [];

    // مرحلهٔ ۱: اعتبارسنجی خطوط ورودی
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (isConfigLink(trimmed)) {
        const parsed = parseLink(trimmed);
        if (parsed) {
          validLines.push({ line: trimmed, parsed, originalIndex: idx });
        } else {
          invalidLines.push({
            line: trimmed,
            reason: 'ساختار لینک نامعتبر',
            originalIndex: idx,
          });
        }
      } else {
        invalidLines.push({
          line: trimmed,
          reason: 'پروتکل پشتیبانی نمی‌شود',
          originalIndex: idx,
        });
      }
    });

    // نمایش آمار ورودی
    inputStats.innerHTML =
      `کل خطوط: <strong>${nonEmptyLines.length}</strong> | ` +
      `معتبر: <span class="success">${validLines.length}</span> | ` +
      `نامعتبر: <span class="error">${invalidLines.length}</span>`;

    // نمایش خطاها
    if (invalidLines.length > 0) {
      errorCard.style.display = 'block';
      errorList.innerHTML = invalidLines
        .map(
          (e) =>
            `<li><span class="line-num">خط ${e.originalIndex + 1}:</span> ` +
            `${escapeHtml(e.line)}<br>` +
            `<small style="color:#ff6b6b">${e.reason}</small></li>`
        )
        .join('');
    } else {
      errorCard.style.display = 'none';
      errorList.innerHTML = '';
    }

    // مرحلهٔ ۲: پردازش خطوط معتبر
    const renameEnabled = enableRename.checked;
    const prefix = renamePrefix.value.trim();
    const removeFrag = removeFragment.checked;
    const echEnabled = enableEch.checked;
    const echRaw = echValue.value.trim();

    const results = [];

    validLines.forEach((item, idx) => {
      const parsed = item.parsed;
      let newFragment = parsed.fragment;

      // الف) تغییر نام (Fragment)
      if (renameEnabled && prefix) {
        newFragment = prefix + '-' + (idx + 1);
      } else if (removeFrag) {
        newFragment = '';
      }
      // در غیر این صورت Fragment اصلی حفظ می‌شود.

      // ب) افزودن پارامتر ECH
      const extraQuery = [];
      if (echEnabled && echRaw) {
        const existingParams = parseQuery(parsed.query);
        const hasEch = existingParams.some(
          (p) => p.key.toLowerCase() === 'ech'
        );
        // اگر از قبل ech وجود دارد، دست نمی‌زنیم (اصل عدم تغییر پارامترهای ناشناخته)
        if (!hasEch) {
          extraQuery.push({
            key: 'ech',
            value: echRaw,
            raw: 'ech=' + echRaw,
          });
        }
      }

      // ج) ساخت لینک نهایی
      const resultLink = buildLink(parsed, newFragment, extraQuery);
      results.push(resultLink);
    });

    // مرحلهٔ ۳: نمایش خروجی
    outputLinks.value = results.join('\n');

    outputStats.innerHTML =
      `خروجی: <strong>${results.length}</strong> کانفیگ | ` +
      `حذف‌شده: <span class="error">${invalidLines.length}</span>`;

    const hasOutput = results.length > 0;
    copyBtn.disabled = !hasOutput;
    downloadBtn.disabled = !hasOutput;
  }

  /* ---------- توابع کمکی ---------- */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function copyOutput() {
    const text = outputLinks.value;
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        copyBtn.textContent = 'کپی شد ✓';
        setTimeout(() => (copyBtn.textContent = 'کپی'), 1500);
      })
      .catch(() => {
        // مسیر جایگزین برای مرورگرهای قدیمی
        outputLinks.select();
        document.execCommand('copy');
        copyBtn.textContent = 'کپی شد ✓';
        setTimeout(() => (copyBtn.textContent = 'کپی'), 1500);
      });
  }

  function downloadOutput() {
    const text = outputLinks.value;
    if (!text) return;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configs-' + Date.now() + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ---------- رویدادها ---------- */
  processBtn.addEventListener('click', process);

  enableRename.addEventListener('change', () => {
    renameBody.style.display = enableRename.checked ? 'block' : 'none';
  });

  enableEch.addEventListener('change', () => {
    echBody.style.display = enableEch.checked ? 'block' : 'none';
  });

  copyBtn.addEventListener('click', copyOutput);
  downloadBtn.addEventListener('click', downloadOutput);

  // حالت اولیه
  renameBody.style.display = enableRename.checked ? 'block' : 'none';
  echBody.style.display = enableEch.checked ? 'block' : 'none';

  // پاک کردن خروجی هنگام تغییر ورودی
  inputLinks.addEventListener('input', () => {
    outputLinks.value = '';
    outputStats.innerHTML = '';
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    errorCard.style.display = 'none';
    errorList.innerHTML = '';
    inputStats.innerHTML = '';
  });
})();
