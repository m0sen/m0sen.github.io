/**
 * m0sen.ir - Blog Engine Script
 * Version: 2.4.0 (با تاریخ شمسی)
 * Stack: Pure Vanilla ES6+
 */

(function () {
  'use strict';

  const CONFIG = {
    snippetLength: 190,
    readMoreText: 'ادامه مطلب ←',
    copySuccessText: 'کپی شد!',
    copyDefaultText: 'کپی کد',
    scroll: {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15,
      headerScrollThreshold: 80,
      headerHideThreshold: 100
    }
  };

  // ================================================================
  //  0. تبدیل تاریخ میلادی به شمسی
  // ================================================================

  /**
   * تبدیل تاریخ میلادی به شمسی با فرمت دلخواه
   * @param {Date} date - تاریخ میلادی
   * @param {string} format - 'full' = ۱۵ مرداد ۱۴۰۵ | 'short' = ۱۴۰۵/۰۵/۱۵
   */
  function toPersianDate(date, format) {
    if (!date || isNaN(date.getTime())) return '';
    
    // الگوریتم تبدیل میلادی به شمسی
    function gregorianToJalali(gy, gm, gd) {
      var g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
      var jy, jm, jd;
      if (gy > 1600) {
        jy = 979;
        gy -= 1600;
      } else {
        jy = 0;
        gy -= 621;
      }
      var gy2 = (gm > 2) ? (gy + 1) : gy;
      var days = (gy * 365) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
      jy += 33 * Math.floor(days / 12053);
      days %= 12053;
      jy += 4 * Math.floor(days / 1461);
      days %= 1461;
      if (days > 365) {
        jy += Math.floor((days - 1) / 366);
        days = (days - 1) % 366;
      }
      jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
      jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
      return [jy, jm, jd];
    }

    // نام ماه‌های شمسی
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    const gy = date.getFullYear();
    const gm = date.getMonth() + 1;
    const gd = date.getDate();

    const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);

    if (format === 'full') {
      return `${jd} ${persianMonths[jm - 1]} ${jy}`;
    } else if (format === 'short') {
      return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    } else if (format === 'month-year') {
      return `${persianMonths[jm - 1]} ${jy}`;
    } else {
      return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    }
  }

  // ================================================================
  //  1. Thumbnail با استفاده از Featured Image
  // ================================================================

  function initPostThumbnails() {
    const posts = document.querySelectorAll('.post-entry');
    
    posts.forEach((post) => {
      if (post.querySelector('.post-thumbnail')) return;
      if (post.closest('.single-post')) return;
      
      const content = post.querySelector('.post-content');
      if (!content) return;
      
      const featuredImage = content.querySelector('img.featured, img.thumbnail, img[data-featured="true"]');
      const firstImage = featuredImage || content.querySelector('img:not(.no-thumbnail)');
      
      const thumbnailContainer = document.createElement('div');
      thumbnailContainer.className = 'post-thumbnail';
      
      const dateElement = post.querySelector('.post-date');
      let dateText = '';
      if (dateElement) {
        const isoDate = dateElement.getAttribute('datetime');
        if (isoDate) {
          try {
            const d = new Date(isoDate);
            if (!isNaN(d.getTime())) {
              dateText = toPersianDate(d, 'short');
            }
          } catch (e) {}
        }
        if (!dateText) {
          dateText = dateElement.textContent.trim();
        }
      }
      
      if (firstImage) {
        const imgClone = firstImage.cloneNode(true);
        imgClone.removeAttribute('width');
        imgClone.removeAttribute('height');
        imgClone.loading = 'lazy';
        imgClone.alt = imgClone.alt || 'تصویر شاخص مطلب';
        thumbnailContainer.appendChild(imgClone);
        post.classList.add('has-thumbnail');
        
        if (dateText) {
          const badge = document.createElement('span');
          badge.className = 'thumbnail-badge';
          badge.textContent = dateText;
          thumbnailContainer.appendChild(badge);
        }
      } else {
        thumbnailContainer.innerHTML = `
          <div class="thumbnail-placeholder">
            <span>📄</span>
          </div>
        `;
      }
      
      post.insertBefore(thumbnailContainer, post.firstChild);
      
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'post-content-wrapper';
      
      const children = Array.from(post.children);
      const thumbnailIndex = children.indexOf(thumbnailContainer);
      
      children.forEach((child, i) => {
        if (i > thumbnailIndex) {
          contentWrapper.appendChild(child);
        }
      });
      
      post.appendChild(contentWrapper);
    });
  }

  // ================================================================
  //  2. انیمیشن‌های اسکرول
  // ================================================================

  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
      '.scroll-animate, .scroll-up, .scroll-down, .scroll-left, ' +
      '.scroll-right, .scroll-zoom, .scroll-rotate, ' +
      '.post-entry, .side-column .widget, .site-footer'
    );

    if (animatedElements.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: CONFIG.scroll.rootMargin,
      threshold: CONFIG.scroll.threshold
    };

    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    animatedElements.forEach(function(element) {
      observer.observe(element);
    });

    initHeaderScrollEffect();
  }

  function initHeaderScrollEffect() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          const currentScrollY = window.scrollY;
          
          if (currentScrollY > CONFIG.scroll.headerScrollThreshold) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
          
          if (currentScrollY > lastScrollY && 
              currentScrollY > CONFIG.scroll.headerHideThreshold) {
            header.style.transform = 'translateY(-100%)';
          } else {
            header.style.transform = 'translateY(0)';
          }
          
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ================================================================
  //  3. خلاصه‌سازی محتوا
  // ================================================================

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

  // ================================================================
  //  4. کپی کد
  // ================================================================

  function initCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.post-content pre');

    codeBlocks.forEach((pre) => {
      if (pre.querySelector('.copy-code-btn')) return;

      pre.style.position = 'relative';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'copy-code-btn';
      copyBtn.textContent = CONFIG.copyDefaultText;
      copyBtn.setAttribute('aria-label', 'کپی کردن کد');
      
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
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      });

      copyBtn.addEventListener('mouseenter', () => {
        copyBtn.style.color = '#81e9aa';
        copyBtn.style.borderColor = '#81e9aa';
        copyBtn.style.transform = 'scale(1.05)';
        copyBtn.style.background = 'rgba(129, 233, 170, 0.12)';
      });

      copyBtn.addEventListener('mouseleave', () => {
        if (copyBtn.textContent !== CONFIG.copySuccessText) {
          copyBtn.style.color = '#9da7b3';
          copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          copyBtn.style.transform = 'scale(1)';
          copyBtn.style.background = 'rgba(255, 255, 255, 0.08)';
        }
      });

      copyBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        
        const codeElement = pre.querySelector('code') || pre;
        const codeText = codeElement.innerText;

        try {
          await navigator.clipboard.writeText(codeText);
          
          copyBtn.textContent = CONFIG.copySuccessText;
          copyBtn.style.color = '#81e9aa';
          copyBtn.style.borderColor = '#81e9aa';
          copyBtn.style.background = 'rgba(129, 233, 170, 0.2)';
          copyBtn.style.transform = 'scale(0.95)';

          setTimeout(() => {
            copyBtn.textContent = CONFIG.copyDefaultText;
            copyBtn.style.color = '#9da7b3';
            copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            copyBtn.style.background = 'rgba(255, 255, 255, 0.08)';
            copyBtn.style.transform = 'scale(1)';
          }, 2000);
        } catch (err) {
          console.error('خطا در کپی کد:', err);
          copyBtn.textContent = 'خطا!';
          copyBtn.style.color = '#ef4444';
          copyBtn.style.borderColor = '#ef4444';
          
          setTimeout(() => {
            copyBtn.textContent = CONFIG.copyDefaultText;
            copyBtn.style.color = '#9da7b3';
            copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }, 2000);
        }
      });

      pre.appendChild(copyBtn);
    });
  }

  // ================================================================
  //  5. لینک‌های خارجی
  // ================================================================

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
      } catch (e) {}
    });
  }

  // ================================================================
  //  6. تبدیل تاریخ‌ها به شمسی
  // ================================================================

  function normalizeDates() {
    const dateElements = document.querySelectorAll('time.post-date');
    
    dateElements.forEach((el) => {
      const isoDate = el.getAttribute('datetime');
      if (isoDate) {
        try {
          const d = new Date(isoDate);
          if (!isNaN(d.getTime())) {
            // فرمت کامل شمسی: ۱۵ مرداد ۱۴۰۵
            const persianDate = toPersianDate(d, 'full');
            el.textContent = persianDate;
            
            // به‌روزرسانی datetime با تاریخ شمسی (اختیاری)
            // el.setAttribute('datetime', persianDate);
          }
        } catch (e) {}
      }
    });

    // ===== تبدیل تاریخ‌های بایگانی =====
    const archiveLinks = document.querySelectorAll('#archivesList a, .widget-list a');
    archiveLinks.forEach((link) => {
      const text = link.textContent.trim();
      // تشخیص تاریخ‌های میلادی مثل "September 2026" یا "2026/09"
      const match = text.match(/(\w+)\s+(\d{4})/); // September 2026
      if (match) {
        const monthName = match[1];
        const year = parseInt(match[2]);
        const monthMap = {
          'January': 0, 'February': 1, 'March': 2, 'April': 3,
          'May': 4, 'June': 5, 'July': 6, 'August': 7,
          'September': 8, 'October': 9, 'November': 10, 'December': 11
        };
        const month = monthMap[monthName];
        if (month !== undefined && year) {
          const date = new Date(year, month, 1);
          const persianDate = toPersianDate(date, 'month-year');
          link.textContent = persianDate;
        }
      }
    });
  }

  // ================================================================
  //  7. بهینه‌سازی تاخیر پله‌ای
  // ================================================================

  function initStaggeredAnimations() {
    const staggeredElements = document.querySelectorAll(
      '.post-entry, .side-column .widget'
    );
    
    staggeredElements.forEach((el, index) => {
      if (!el.classList.contains('visible')) {
        const delay = Math.min((index * 0.07), 0.6);
        el.style.transitionDelay = `${delay}s`;
      }
    });
  }

  // ================================================================
  //  8. اجرای اصلی
  // ================================================================

  function init() {
    // مرحله 1: تبدیل تاریخ‌ها به شمسی (قبل از همه)
    normalizeDates();
    
    // مرحله 2: Thumbnail
    initPostThumbnails();
    
    // مرحله 3: خلاصه‌سازی
    initPostSnippets();
    
    // مرحله 4: کپی کد
    initCodeBlocks();
    
    // مرحله 5: لینک‌های خارجی
    initExternalLinks();
    
    // مرحله 6: تاخیر پله‌ای
    initStaggeredAnimations();
    
    // مرحله 7: انیمیشن‌های اسکرول
    setTimeout(initScrollAnimations, 100);
    
    console.log('🚀 m0sen.ir Blog Engine با موفقیت بارگذاری شد!');
    console.log('📅 تاریخ امروز:', toPersianDate(new Date(), 'full'));
  }

  // ================================================================
  //  9. مدیریت رویدادها
  // ================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // بازسازی تاریخ‌ها در صورت تغییر محتوا (مثلاً در SPA)
  if (window.MutationObserver) {
    const dateObserver = new MutationObserver(function() {
      // بررسی وجود تاریخ‌های جدید
      const dates = document.querySelectorAll('time.post-date:not([data-converted])');
      if (dates.length > 0) {
        dates.forEach(el => {
          const isoDate = el.getAttribute('datetime');
          if (isoDate) {
            try {
              const d = new Date(isoDate);
              if (!isNaN(d.getTime())) {
                const persianDate = toPersianDate(d, 'full');
                el.textContent = persianDate;
                el.setAttribute('data-converted', 'true');
              }
            } catch (e) {}
          }
        });
      }
    });
    
    dateObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

})();
