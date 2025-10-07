document.addEventListener('DOMContentLoaded', () => {
  const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  if (navbarBurgers.length < 1) return;

  const navMap = new Map();

  const getCurrentNavPos = () => {
    if (
      document.documentElement.dataset.navpos === 'bottom' ||
      document.documentElement.classList.contains('navpos--bottom')
    ) {
      return 'bottom';
    }
    return 'top';
  };

  const getActiveNav = () => {
    const currentPos = getCurrentNavPos();
    if (currentPos === 'bottom') {
      return document.querySelector('.nav--above');
    } else {
      return document.querySelector('.nav--below');
    }
  };

  navbarBurgers.forEach((navbarBurger, i) => {
    let nav = null;
    if (navbarBurger.dataset.target) {
      nav = document.getElementById(navbarBurger.dataset.target);
    }
    if (nav) {
      navMap.set(i, nav);
      navbarBurger.addEventListener('click', () => {
        navbarBurger.classList.toggle('nav--active');

        // Toggle the correct nav based on current position
        const activeNav = getActiveNav();
        const inactiveNav =
          getCurrentNavPos() === 'bottom'
            ? document.querySelector('.nav--below')
            : document.querySelector('.nav--above');

        if (activeNav) {
          activeNav.classList.toggle('nav--active');
        }

        // Ensure the inactive nav is hidden
        if (inactiveNav) {
          inactiveNav.classList.remove('nav--active');
        }
      });
    }
  });

  // Close the navbar when clicking outside of it
  function clickAnywhere(e) {
    navbarBurgers.forEach((navbarBurger, i) => {
      if (navMap.has(i)) {
        const nav = navMap.get(i);
        const navAbove = document.querySelector('.nav--above');
        const navBelow = document.querySelector('.nav--below');

        if (
          !navbarBurger.contains(e.target) &&
          !nav.contains(e.target) &&
          (!navAbove || !navAbove.contains(e.target)) &&
          (!navBelow || !navBelow.contains(e.target))
        ) {
          navbarBurger.classList.remove('nav--active');
          nav.classList.remove('nav--active');
          if (navAbove) navAbove.classList.remove('nav--active');
          if (navBelow) navBelow.classList.remove('nav--active');
        }
      }
    });
  }

  document.addEventListener('touchstart', clickAnywhere, { passive: true });
  document.addEventListener('click', clickAnywhere);
  document.addEventListener('touchend', clickAnywhere);
  document.addEventListener('mouseup', clickAnywhere);

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) {
      navbarBurgers.forEach((navbarBurger, i) => {
        if (navMap.has(i)) {
          const nav = navMap.get(i);
          const navAbove = document.querySelector('.nav--above');
          const navBelow = document.querySelector('.nav--below');

          navbarBurger.classList.remove('nav--active');
          nav.classList.remove('nav--active');
          if (navAbove) navAbove.classList.remove('nav--active');
          if (navBelow) navBelow.classList.remove('nav--active');
        }
      });
    }
  });

  const header = document.querySelector('header.header');
  if (header) header.classList.add('nav-loaded');
});
