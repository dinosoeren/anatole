// thumbnail-hd-loader.js
// This script finds all <img> elements with a data-hd-src attribute, preloads
// the HD image when it comes into viewport, and swaps the src when the HD image
// is loaded. Use by adding data-hd-src to your <img> tags.

document.addEventListener('DOMContentLoaded', function () {
  const hdImages = document.querySelectorAll('img[data-hd-src]');

  if (hdImages.length === 0) return;

  // Function to load HD image
  function loadHdImage(img) {
    const hdSrc = img.getAttribute('data-hd-src');
    if (!hdSrc) return;

    const hdImg = new window.Image();
    hdImg.onload = function () {
      img.src = hdSrc;
      img.removeAttribute('data-hd-src');
    };
    setTimeout(() => {
      hdImg.src = hdSrc;
    }, 1);
  }

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
        rootMargin: '50px 0px', // Start loading 50px before image comes in view
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
