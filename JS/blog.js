/**
 * m0sen.ir - Blog Engine Script
 * Version: 3.3.0 (تاریخ میلادی با نام ماه‌های فارسی)
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
  //  0. تبدیل تاریخ به فرمت میلادی با نام ماه‌های فارسی
  // ================================================================

  /**
   * تبدیل تاریخ میلادی به فرمت: 4 سپتامبر 2026
   */
  function formatGregorianDate(date) {
    if (!date || isNaN(date.getTime())) return '';
    
    // نام ماه‌های میلادی به فارسی
    const months = [
      'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
      'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  // ================================================================
  //  1. Thumbnail (فقط در صفحه اصلی و آرشیو)
  // ================================================================

  function initPostThumbnails() {
    // بررسی: فقط در صفحات چند پست (صفحه اصلی، آرشیو، برچسب) اجرا بشه
    if (document.querySelector('body.item-view')) {
      console.log('📄 صفحه پست تکی است - Thumbnail نمایش داده نمیشود');
      return;
    }

    const posts = document.querySelectorAll('.post-entry');
    if (posts.length === 0) return;

    posts.forEach((post) => {
      if (post.querySelector('.post-thumbnail')) return;
      
      const content = post.querySelector('.post-content');
      if (!content) return;
      
      const featuredImage = content.querySelector('img.featured, img.thumbnail, img[data-featured="true"]');
      const firstImage = featuredImage || content.querySelector('img:not(.no-thumbnail)');
      
      const thumbnailContainer = document.createElement('div');
      thumbnailContainer.className = 'post-thumbnail';
      
      // گرفتن تاریخ از المان date
      const dateElement = post.querySelector('.post-date');
      let dateText = '';
      if (dateElement) {
        dateText = dateElement.textContent.trim();
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
  //  2. تبدیل تاریخ پست‌ها به میلادی با نام ماه‌های فارسی
  // ================================================================

  function normalizeDatesToGregorian() {
    const dateElements = document.querySelectorAll('time.post-date');
    
    dateElements.forEach((el) => {
      const isoDate = el.getAttribute('datetime');
      if (isoDate) {
        try {
          const d = new Date(isoDate);
          if (!isNaN(d.getTime())) {
            // تبدیل به فرمت: 4 سپتامبر 2026
            const gregorianDate = formatGregorianDate(d);
            el.textContent = gregorianDate;
          }
        } catch (e) {
          // در صورت خطا، محتوای اصلی حفظ شود
        }
      }
    });
  }

  // ================================================================
  //  3. انیمیشن‌های اسکرول
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
  //  4. خلاصه‌سازی محتوا
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
  //  5. کپی کد
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
  //  6. لینک‌های خارجی
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
  //  7. تاخیر پله‌ای
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
    // مرحله 1: تبدیل تاریخ به میلادی با نام ماه‌های فارسی (قبل از همه)
    normalizeDatesToGregorian();
    
    // مرحله 2: Thumbnail فقط در صفحه اصلی
    initPostThumbnails();
    
    initPostSnippets();
    initCodeBlocks();
    initExternalLinks();
    initStaggeredAnimations();
    
    setTimeout(initScrollAnimations, 100);
    
    console.log('🚀 m0sen.ir Blog Engine با موفقیت بارگذاری شد!');
  }

  // ================================================================
  //  9. مدیریت رویدادها
  // ================================================================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // بازسازی تاریخ‌ها در صورت تغییر محتوا
  if (window.MutationObserver) {
    const dateObserver = new MutationObserver(function() {
      const dates = document.querySelectorAll('time.post-date:not([data-converted])');
      if (dates.length > 0) {
        dates.forEach(el => {
          const isoDate = el.getAttribute('datetime');
          if (isoDate) {
            try {
              const d = new Date(isoDate);
              if (!isNaN(d.getTime())) {
                const gregorianDate = formatGregorianDate(d);
                el.textContent = gregorianDate;
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
