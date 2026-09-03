/**
 * m0sen.ir - Blog Engine Script
 * Version: 2.1.0 (با انیمیشن‌های اسکرول و نرم‌سازی کامل)
 * Stack: Pure Vanilla ES6+
 */

(function () {
  'use strict';

  // --- Configuration ---
  const CONFIG = {
    snippetLength: 190,
    readMoreText: 'ادامه مطلب ←',
    copySuccessText: 'کپی شد!',
    copyDefaultText: 'کپی کد',
    
    // ═══ تنظیمات انیمیشن اسکرول ═══
    scroll: {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15,
      headerScrollThreshold: 80,
      headerHideThreshold: 100
    }
  };

  // ================================================================
  //  1. انیمیشن‌های اسکرول (Scroll Animations)
  // ================================================================
  
  /**
   * فعال‌سازی انیمیشن‌های اسکرول با Intersection Observer
   * المان‌های دارای کلاس‌های scroll-* را هنگام ورود به دید، فعال می‌کند
   */
  function initScrollAnimations() {
    // انتخاب تمام المان‌های دارای انیمیشن اسکرول
    const animatedElements = document.querySelectorAll(
      '.scroll-animate, .scroll-up, .scroll-down, .scroll-left, ' +
      '.scroll-right, .scroll-zoom, .scroll-rotate, ' +
      '.post-entry, .side-column .widget, .site-footer'
    );

    // اگر المانی وجود نداشت، خروج
    if (animatedElements.length === 0) return;

    // تنظیمات Observer
    const observerOptions = {
      root: null,
      rootMargin: CONFIG.scroll.rootMargin,
      threshold: CONFIG.scroll.threshold
    };

    // ایجاد Observer
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // (اختیاری) برای المان‌هایی که فقط یک بار انیمیشن می‌خواهند
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // شروع مشاهده هر المان
    animatedElements.forEach(function(element) {
      observer.observe(element);
    });

    // ═══ مدیریت هدر هنگام اسکرول ═══
    initHeaderScrollEffect();

    console.log(`✅ ${animatedElements.length} المان برای انیمیشن اسکرول ثبت شدند.`);
  }

  /**
   * افکت هدر: تغییر ظاهر و مخفی/نمایش هنگام اسکرول
   */
  function initHeaderScrollEffect() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          const currentScrollY = window.scrollY;
          
          // اضافه/حذف کلاس scrolled
          if (currentScrollY > CONFIG.scroll.headerScrollThreshold) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
          
          // مخفی کردن هدر هنگام اسکرول به پایین
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
  //  2. خلاصه‌سازی هوشمند محتوا (Snippets)
  // ================================================================

  /**
   * خلاصه‌سازی هوشمند محتوای مطالب در صفحات ایندکس/آرشیو
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

  // ================================================================
  //  3. دکمه کپی برای بلوک‌های کد
  // ================================================================

  /**
   * افزودن دکمه کپی به بلوک‌های کد (Code Highlighting / Blocks)
   */
  function initCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.post-content pre');

    codeBlocks.forEach((pre) => {
      // جلوگیری از دوباره‌کاری
      if (pre.querySelector('.copy-code-btn')) return;

      pre.style.position = 'relative';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'copy-code-btn';
      copyBtn.textContent = CONFIG.copyDefaultText;
      copyBtn.setAttribute('aria-label', 'کپی کردن کد');
      
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
          
          // نمایش موفقیت
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
          
          // بازخورد خطا
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
  //  4. لینک‌های خارجی (External Links)
  // ================================================================

  /**
   * باز کردن لینک‌های خارجی در تب جدید با تمهیدات امنیتی
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
        // آدرس استاندارد نیست، نادیده گرفته شود
      }
    });
  }

  // ================================================================
  //  5. فرمت‌بندی تاریخ‌ها (Date Formatting)
  // ================================================================

  /**
   * فرمت‌بندی تاریخ‌ها به میلادی تمیز (YYYY/MM/DD)
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
          // در صورت خطا، محتوای اصلی حفظ شود
        }
      }
    });
  }

  // ================================================================
  //  6. انیمیشن‌های اضافی (Extra Animations)
  // ================================================================

  /**
   * افزودن انیمیشن‌های ورود پله‌ای به المان‌ها
   * (برای المان‌هایی که کلاس delay-* دارند)
   */
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
  //  7. بهینه‌سازی عملکرد (Performance)
  // ================================================================

  /**
   * تشخیص مرورگر و اعمال polyfill در صورت نیاز
   */
  function checkBrowserSupport() {
    if (!('IntersectionObserver' in window)) {
      console.warn('⚠️ مرورگر شما از Intersection Observer پشتیبانی نمی‌کند.');
      console.warn('⚠️ انیمیشن‌های اسکرول غیرفعال می‌شوند.');
      
      // به عنوان fallback، همه المان‌ها را visible کنید
      document.querySelectorAll('.scroll-animate, .scroll-up, .scroll-down, ' +
        '.scroll-left, .scroll-right, .scroll-zoom, .scroll-rotate, ' +
        '.post-entry, .side-column .widget, .site-footer')
        .forEach(el => el.classList.add('visible'));
      
      return false;
    }
    return true;
  }

  // ================================================================
  //  8. اجرای اصلی (Initialization)
  // ================================================================

  /**
   * اجرای همه ماژول‌ها پس از آماده‌سازی DOM
   */
  function init() {
    // بررسی پشتیبانی مرورگر
    const supportsObserver = checkBrowserSupport();
    
    // اجرای ماژول‌ها
    initPostSnippets();
    initCodeBlocks();
    initExternalLinks();
    normalizeDates();
    initStaggeredAnimations();
    
    // انیمیشن‌های اسکرول (در صورت پشتیبانی)
    if (supportsObserver) {
      setTimeout(initScrollAnimations, 100);
    }
    
    console.log('🚀 m0sen.ir Blog Engine با موفقیت بارگذاری شد!');
    console.log(`📅 نسخه: 2.1.0 - ${new Date().toLocaleDateString('fa-IR')}`);
  }

  // ================================================================
  //  9. مدیریت رویدادها (Event Handlers)
  // ================================================================

  // اجرا پس از آماده‌سازی DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ═══ بارگذاری مجدد انیمیشن‌ها در صورت تغییر محتوا ═══
  if (window.MutationObserver) {
    const contentObserver = new MutationObserver(function(mutations) {
      let shouldReinit = false;
      
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) {
              if (node.matches && (
                node.matches('.post-entry, .side-column .widget, .scroll-animate, .scroll-up') ||
                node.querySelector('.post-entry, .side-column .widget, .scroll-animate, .scroll-up')
              )) {
                shouldReinit = true;
              }
            }
          });
        }
      });
      
      if (shouldReinit) {
        console.log('🔄 محتوای جدید شناسایی شد، راه‌اندازی مجدد انیمیشن‌ها...');
        if ('IntersectionObserver' in window) {
          setTimeout(initScrollAnimations, 200);
        }
      }
    });
    
    contentObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

})();
