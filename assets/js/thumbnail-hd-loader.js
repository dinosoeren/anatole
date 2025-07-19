// thumbnail-hd-loader.js
// This script finds all <img> elements with a data-hd-src attribute, preloads the HD image, and swaps the src when the HD image is loaded. Use by adding data-hd-src to your <img> tags.

document.addEventListener('DOMContentLoaded', function () {
  const hdImages = document.querySelectorAll('img[data-hd-src]');
  hdImages.forEach((img) => {
    const hdSrc = img.getAttribute('data-hd-src');
    if (!hdSrc) return;
    const hdImg = new window.Image();
    hdImg.onload = function () {
      img.src = hdSrc;
      img.removeAttribute('data-hd-src');
    };
    hdImg.src = hdSrc;
  });
});
