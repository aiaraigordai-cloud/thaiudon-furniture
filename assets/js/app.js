// app.js - Global Interactions for Thai Udon Furniture Website

(function () {
  'use strict';

  // Video Controls
  function setupHeroVideo() {
    const video = document.getElementById('hero-promo-video');
    const playBtn = document.getElementById('video-toggle-play');
    const muteBtn = document.getElementById('video-toggle-mute');

    if (!video) return;

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (video.paused) {
          video.play();
          playBtn.innerHTML = '⏸️';
          playBtn.title = 'หยุดชั่วคราว';
        } else {
          video.pause();
          playBtn.innerHTML = '▶️';
          playBtn.title = 'เล่นวิดีโอ';
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? '🔇' : '🔊';
        muteBtn.title = video.muted ? 'เปิดเสียง' : 'ปิดเสียง';
      });
    }

    // Try autoplay muted
    video.muted = true;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented, show play icon
        if (playBtn) playBtn.innerHTML = '▶️';
      });
    }
  }

  // Mobile Menu Toggle
  function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('site-nav-menu');

    if (!menuBtn || !navMenu) return;

    menuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('show-mobile');
      const isExpanded = navMenu.classList.contains('show-mobile');
      menuBtn.setAttribute('aria-expanded', isExpanded);
      menuBtn.innerHTML = isExpanded ? '✕' : '☰';
    });

    // Close menu when clicking links
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('show-mobile');
        menuBtn.setAttribute('aria-expanded', 'false');
        if (menuBtn) menuBtn.innerHTML = '☰';
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('show-mobile') && !navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        navMenu.classList.remove('show-mobile');
        menuBtn.setAttribute('aria-expanded', 'false');
        if (menuBtn) menuBtn.innerHTML = '☰';
      }
    });
  }

  // Header Scroll Effect
  function setupHeaderScroll() {
    const header = document.querySelector('header.site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.style.boxShadow = '0 4px 20px rgba(64, 46, 32, 0.12)';
      } else {
        header.style.boxShadow = 'none';
      }
    });
  }

  // Smooth Scroll
  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    setupHeroVideo();
    setupMobileMenu();
    setupHeaderScroll();
    setupSmoothScroll();
  });
})();
