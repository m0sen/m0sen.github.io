/**
 * m0sen.ir - Blog Engine Script
 * Version: 2.2.0 (با Thumbnail خودکار)
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
    
    // ═══ تنظیمات Thumbnail ═══
    thumbnail: {
      enabled: true,
      placeholderEmoji: '📄',
      badgeDateFormat: 'YYYY/MM/DD'
    },
    
    // ═══ تنظیمات انیمیشن اسکرول ═══
    scroll: {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.15,
      headerScrollThreshold: 80,
      headerHideThreshold: 100
    }
  };

  // ================================================================
  //  1. Thumbnail خودکار (استخراج اولین تصویر از پست)
  // ================================================================

  /**
   * استخراج خودکار اولین تصویر از محتوای پست
   * و اضافه کردن آن به‌عنوان Thumbnail
   */
  function initPostThumbnails() {
    // فقط در صفحه اصلی و آرشیو (چند پست) اجرا بشه
    const posts = document.querySelectorAll('.post-entry');
    
    posts.forEach((post, index) => {
      // اگر پست قبلاً thumbnail داشت یا در صفحه تک پست هستیم، نادیده بگیر
      if (post.querySelector('.post-thumbnail')) return;
      if (post.closest('.single-post')) return;
      
      // پیدا کردن محتوای پست
      const content = post.querySelector('.post-content');
      if (!content) return;
      
      // پیدا کردن اولین تصویر داخل محتوا
      const firstImage = content.querySelector('img');
      
      // ایجاد container برای thumbnail
      const thumbnailContainer = document.createElement('div');
      thumbnailContainer.className = 'post-thumbnail';
      
      // دریافت تاریخ پست برای برچسب
      const dateElement = post.querySelector('.post-date');
      let dateText = '';
      if (dateElement) {
        dateText = dateElement.textContent.trim();
      }
      
      if (firstImage) {
        // کپی کردن تصویر
        const imgClone = firstImage.cloneNode(true);
        imgClone.removeAttribute('width');
        imgClone.removeAttribute('height');
        imgClone.loading = 'lazy';
        imgClone.alt = imgClone.alt || 'تصویر شاخص مطلب';
        thumbnailContainer.appendChild(imgClone);
        
        // اضافه کردن کلاس has-thumbnail به پست
        post.classList.add('has-thumbnail');
        
        // اضافه کردن برچسب تاریخ روی تصویر (اختیاری)
        if (dateText) {
          const badge = document.createElement('span');
          badge.className = 'thumbnail-badge';
          badge.textContent = dateText;
          thumbnailContainer.appendChild(badge);
        }
        
      } else {
        // Placeholder برای پست‌های بدون تصویر
        thumbnailContainer.innerHTML = `
          <div class="thumbnail-placeholder">
            <span>${CONFIG.thumbnail.placeholderEmoji}</span>
          </div>
        `;
      }
      
      // قرار دادن thumbnail در ابتدای پست
      post.insertBefore(thumbnailContainer, post.firstChild);
      
      // اضافه کردن کلاس wrapper برای محتوای پست
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'post-content-wrapper';
      
      // انتقال محتوای پست به wrapper
      const children = Array.from(post.children);
      const thumbnailIndex = children.indexOf(thumbnailContainer);
      
      // همه المان‌های بعد از thumbnail رو به wrapper منتقل کن
      children.forEach((child, i) => {
        if (i > thumbnailIndex) {
          contentWrapper.appendChild(child);
        }
      });
      
      post.appendChild(contentWrapper);
    });
  }

  // ================================================================
  //  2. انیمیشن‌های اسکرول (Scroll Animations)
  // ================================================================
  
  /**
   * فعال‌سازی انیمیشن‌های اسکرول با Intersection Observer
   */
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
  //  3. خلاصه‌سازی هوشمند محتوا (Snippets)
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
  //  4. دکمه کپی برای بلوک‌های کد
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
  //  5. لینک‌های خارجی (External Links)
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
      } catch (e) {
        // آدرس استاندارد نیست، نادیده گرفته شود
      }
    });
  }

  // ================================================================
  //  6. فرمت‌بندی تاریخ‌ها (Date Formatting)
  // ================================================================

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
  //  7. انیمیشن‌های اضافی (Extra Animations)
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
  //  8. بهینه‌سازی عملکرد (Performance)
  // ================================================================

  function checkBrowserSupport() {
    if (!('IntersectionObserver' in window)) {
      console.warn('⚠️ مرورگر شما از Intersection Observer پشتیبانی نمی‌کند.');
      console.warn('⚠️ انیمیشن‌های اسکرول غیرفعال می‌شوند.');
      
      document.querySelectorAll('.scroll-animate, .scroll-up, .scroll-down, ' +
        '.scroll-left, .scroll-right, .scroll-zoom, .scroll-rotate, ' +
        '.post-entry, .side-column .widget, .site-footer')
        .forEach(el => el.classList.add('visible'));
      
      return false;
    }
    return true;
  }

  // ================================================================
  //  9. اجرای اصلی (Initialization)
  // ================================================================

  function init() {
    // ═══ مرحله 1: Thumbnail (قبل از همه) ═══
    if (CONFIG.thumbnail.enabled) {
      initPostThumbnails();
    }
    
    // ═══ مرحله 2: بررسی پشتیبانی مرورگر ═══
    const supportsObserver = checkBrowserSupport();
    
    // ═══ مرحله 3: اجرای ماژول‌ها ═══
    initPostSnippets();
    initCodeBlocks();
    initExternalLinks();
    normalizeDates();
    initStaggeredAnimations();
    
    // ═══ مرحله 4: انیمیشن‌های اسکرول ═══
    if (supportsObserver) {
      setTimeout(initScrollAnimations, 100);
    }
    
    console.log('🚀 m0sen.ir Blog Engine با موفقیت بارگذاری شد!');
    console.log(`📅 نسخه: 2.2.0 - ${new Date().toLocaleDateString('fa-IR')}`);
  }

  // ================================================================
  //  10. مدیریت رویدادها (Event Handlers)
  // ================================================================

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
