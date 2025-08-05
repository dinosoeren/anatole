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
      if (navigator.canShare && navigator.canShare()) {
        navigator.share(shareData).catch((err) => {
          console.error('Error sharing:', err);
        });
      }
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(shareData.url).catch((err) => {
        console.error('Failed to copy: ', err);
      });
    });
  });
});
