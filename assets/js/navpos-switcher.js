const getStoredNavPos = () => localStorage.getItem('navpos');

const setNavPos = (position) => {
  localStorage.setItem('navpos', position);
  const html = document.documentElement;
  const prevNavPos = [...html.classList].find((c) => c.match(/navpos--(top|bottom)/));
  if (prevNavPos) {
    html.classList.remove(prevNavPos);
  }
  html.classList.add(`navpos--${position}`);
  html.dataset.navpos = position;
};

const setTopNav = () => {
  setNavPos('top');
};

const setBottomNav = () => {
  setNavPos('bottom');
};

const getActiveNav = () => {
  const currNavPos = getStoredNavPos();
  if (currNavPos === 'bottom') {
    return document.querySelector('.nav--above');
  } else {
    return document.querySelector('.nav--below');
  }
};

const openNav = () => {
  const nav = getActiveNav();
  if (nav) {
    nav.classList.add('nav--active');
  }
};

const switchNavPos = () => {
  const currNavPos = getStoredNavPos();
  switch (currNavPos) {
    case 'top':
      setBottomNav();
      break;
    case 'bottom':
      setTopNav();
      break;
    default:
      setTopNav();
      break;
  }
  openNav();
};

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const navPosSwitchers = document.querySelectorAll('.navpos-switch');
    navPosSwitchers.forEach((switcher) => {
      switcher.addEventListener('click', switchNavPos, false);
    });
  },
  false,
);

// Initialize navbar position from stored preference or default to top
const currNavPos = getStoredNavPos();
if (currNavPos) {
  setNavPos(currNavPos);
} else {
  // Check if there's a default from Hugo config
  const htmlNavPos = document.documentElement.dataset.navpos;
  if (htmlNavPos) {
    setNavPos(htmlNavPos);
  } else {
    setTopNav();
  }
}
