/**
 * m0sen.ir - Blog Engine Script
 * Version: 2.0.0
 * Stack: Pure Vanilla ES6+
 */

(function () {
  'use strict';

  // --- Configuration ---
  const CONFIG = {
    snippetLength: 190, // تعداد کاراکتر برای خلاصه‌سازی در صفحه اصلی
    readMoreText: 'ادامه مطلب ←',
    copySuccessText: 'کپی شد!',
    copyDefaultText: 'کپی کد'
  };

  /**
   * 1. خلاصه‌سازی هوشمند محتوای مطالب در صفحات ایندکس/آرشیو
   */
  function initPostSnippets() {
    const snippets = document.querySelectorAll('.snippet-content[data-summary="true"]');
    
    snippets.forEach((snippet) => {
      const postUrl = snippet.getAttribute('data-url');
      const rawText = snippet.textContent.trim().replace(/\s+/g, ' ');
      
      let summaryText = rawText;
      if (rawText.length > CONFIG.snippetLength) {
        summaryText = rawText.substring(0, CONFIG.snippetLength).trim() + '...';
      }

      snippet.innerHTML = `
        <p class="summary-text">${summaryText}</p>
        ${postUrl ? `<a href="${postUrl}" class="read-more-link">${CONFIG.readMoreText}</a>` : ''}
      `;
    });
  }

  /**
   * 2. افزودن دکمه کپی به بلوک‌های کد (Code Highlighting / Blocks)
   */
  function initCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.post-content pre');

    codeBlocks.forEach((pre) => {
      // ایجاد Wrapper در صورت نیاز
      pre.style.position = 'relative';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'copy-code-btn';
      copyBtn.textContent = CONFIG.copyDefaultText;
      
      // استایل دکمه کپی با دیزاین سیستم دارک
      Object.assign(copyBtn.style, {
        position: 'absolute',
        top: '8px',
        left: '8px',
        fontSize: '0.72rem',
        fontFamily: 'var(--font-mono, monospace)',
        background: 'rgba(255, 255, 255, 0.08)',
        color: '#9da7b3',
        padding: '3px 8px',
        borderRadius: '4px',
        cursor: 'pointer',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.2s ease'
      });

      copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.color = '#81e9aa';
        copyBtn.style.borderColor = '#81e9aa';
      });

      copyBtn.addEventListener('mouseleave', () => {
        if (copyBtn.textContent !== CONFIG.copySuccessText) {
          copyBtn.style.color = '#9da7b3';
          copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
      });

      copyBtn.addEventListener('click', async () => {
        const codeElement = pre.querySelector('code') || pre;
        const codeText = codeElement.innerText;

        try {
          await navigator.clipboard.writeText(codeText);
          copyBtn.textContent = CONFIG.copySuccessText;
          copyBtn.style.color = '#81e9aa';
          copyBtn.style.borderColor = '#81e9aa';

          setTimeout(() => {
            copyBtn.textContent = CONFIG.copyDefaultText;
            copyBtn.style.color = '#9da7b3';
            copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code: ', err);
        }
      });

      pre.appendChild(copyBtn);
    });
  }

  /**
   * 3. باز کردن لینک‌های خارجی در تب جدید با تمهیدات امنیتی
   */
  function initExternalLinks() {
    const postLinks = document.querySelectorAll('.post-content a');
    const currentHost = window.location.hostname;

    postLinks.forEach((link) => {
      try {
        const linkUrl = new URL(link.href, window.location.origin);
        if (linkUrl.hostname && linkUrl.hostname !== currentHost) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      } catch (e) {
        // Not a standard absolute URL, ignore
      }
    });
  }

  /**
   * 4. فرمت‌بندی تاریخ‌ها به میلادی تمیز (YYYY/MM/DD)
   */
  function normalizeDates() {
    const dateElements = document.querySelectorAll('time.post-date');
    
    dateElements.forEach((el) => {
      const isoDate = el.getAttribute('datetime');
      if (isoDate) {
        try {
          const d = new Date(isoDate);
          if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            el.textContent = `${year}/${month}/${day}`;
          }
        } catch (e) {
          // Keep original content if parsing fails
        }
      }
    });
  }

  /**
   * اجرای ماژول‌ها پس از آماده‌سازی DOM
   */
  function init() {
    initPostSnippets();
    initCodeBlocks();
    initExternalLinks();
    normalizeDates();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
