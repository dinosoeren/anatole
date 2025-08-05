document.addEventListener('DOMContentLoaded', () => {
  const shareButtons = document.querySelectorAll('.share-button');
  if (shareButtons.length === 0) return;
  shareButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const shareData = {
        title: button.getAttribute('data-share-title'),
        text: button.getAttribute('data-share-text'),
        url: button.getAttribute('data-share-url'),
      };
      if (navigator.share) {
        navigator.share(shareData).catch((err) => {
          copyToClipboard(shareData.url);
          console.error('Error sharing:', err);
        });
      } else {
        // Fallback to copy to clipboard
        copyToClipboard(shareData.url);
      }
    });
  });
});

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text).catch((err) => {
    console.error('Failed to copy: ', err);
  });
}
