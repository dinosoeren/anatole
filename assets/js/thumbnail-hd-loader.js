// thumbnail-hd-loader.js
// This script finds all <img> elements with a data-hd-src attribute, preloads
// the HD image when it comes into viewport, and swaps the src when the HD image
// is loaded. Use by adding data-hd-src to your <img> tags.
//
// LCP (Largest Contentful Paint) SAFETY FEATURES:
// 1. Waits for original image to fully load before loading HD version
// 2. Waits for page to be completely loaded (document.readyState === 'complete')
// 3. Uses smooth opacity transitions to prevent jarring visual swaps
// 4. Implements minimum delay (50ms) after original image loads
// 5. Prevents duplicate loading attempts with WeakSet tracking
// 6. Uses Intersection Observer with 100px margin for early loading
//
// USAGE:
// <img src="low-res.jpg" data-hd-src="high-res.jpg" alt="Description" />
//
// CSS CLASSES:
// - .hd-loading: Applied while HD image is loading
//
// ERROR HANDLING:
// - Gracefully falls back to original image on errors

document.addEventListener('DOMContentLoaded', function () {
  const hdImages = document.querySelectorAll('img[data-hd-src]');

  if (hdImages.length === 0) return;

  // Track loading state to prevent multiple loads
  const loadingImages = new WeakSet();

  // Function to load HD image with LCP-safe swapping
  function loadHdImage(img) {
    const hdSrc = img.getAttribute('data-hd-src');
    if (!hdSrc || loadingImages.has(img)) return;

    // Skip images with fetchpriority="high" to avoid LCP interference
    // if (img.getAttribute('fetchpriority') === 'high') {
    //   console.log('Skipping HD load for high-priority image to protect LCP');
    //   return;
    // }

    // Don't load HD image if the original image is still loading
    if (!img.complete) {
      // Wait for original image to load first
      img.addEventListener('load', () => loadHdImage(img), { once: true });
      return;
    }

    // Don't load HD image if the page is still in initial load phase
    if (document.readyState !== 'complete') {
      // Wait for page to fully load
      window.addEventListener('load', () => loadHdImage(img), { once: true });
      return;
    }

    // Mark as loading to prevent duplicate loads
    loadingImages.add(img);

    const hdImg = new window.Image();

    hdImg.onload = function () {
      // Ensure minimum time has passed since original image loaded to prevent jarring swaps
      const timeSinceLoad = Date.now() - (img._loadTime || 0);
      const minDelay = 50; // Minimum 50ms delay

      const performSwap = () => {
        // Use a smooth transition to prevent jarring swaps
        img.style.opacity = '0.95';

        // Small delay to ensure smooth transition
        requestAnimationFrame(() => {
          img.src = hdSrc;
          img.style.opacity = '1';
          img.removeAttribute('data-hd-src');

          // Clean up any loading states
          img.classList.remove('hd-loading');
          loadingImages.delete(img);
        });
      };

      if (timeSinceLoad < minDelay) {
        setTimeout(performSwap, minDelay - timeSinceLoad);
      } else {
        performSwap();
      }
    };

    hdImg.onerror = function () {
      console.warn('Failed to load HD image:', hdSrc);
      img.classList.remove('hd-loading');
      loadingImages.delete(img);
    };

    // Add loading state class
    img.classList.add('hd-loading');

    // Start loading the HD image
    hdImg.src = hdSrc;
  }

  // Track when original images load
  hdImages.forEach((img) => {
    if (img.complete) {
      img._loadTime = Date.now();
    } else {
      img.addEventListener(
        'load',
        () => {
          img._loadTime = Date.now();
        },
        { once: true },
      );
    }
  });

  // Check if Intersection Observer is supported
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadHdImage(entry.target);
            observer.unobserve(entry.target); // Stop observing once loaded
          }
        });
      },
      {
        rootMargin: '100px 0px', // Start loading 100px before image comes in view
        threshold: 0.1,
      },
    );

    hdImages.forEach((img) => {
      observer.observe(img);
    });
  } else {
    // Fallback for browsers that don't support Intersection Observer
    hdImages.forEach((img) => {
      loadHdImage(img);
    });
  }
});
