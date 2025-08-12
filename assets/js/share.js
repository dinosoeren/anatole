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
  return navigator.clipboard
    .writeText(text)
    .then(() => {
      let overlay = document.querySelector('.notifs-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.classList.add('notifs-overlay');
        document.body.appendChild(overlay);
      }
      const notif = document.createElement('div');
      notif.classList.add('copy-notification');
      notif.innerText = '✅ Post link copied to your clipboard';
      overlay.appendChild(notif);
      setTimeout(() => {
        notif.classList.add('visible');
      }, 50);
      setTimeout(() => {
        notif.classList.remove('visible');
      }, 5000);
      setTimeout(() => {
        document.body.removeChild(notif);
      }, 6000);
    })
    .catch((err) => {
      console.error('Failed to copy: ', err);
    });
}
