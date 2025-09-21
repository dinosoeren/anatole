document.addEventListener('DOMContentLoaded', () => {
  const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  if (navbarBurgers.length < 1) return;

  const navMap = new Map();

  navbarBurgers.forEach((navbarBurger, i) => {
    let nav = null;
    if (navbarBurger.dataset.target) {
      nav = document.getElementById(navbarBurger.dataset.target);
    }
    if (nav) {
      navMap.set(i, nav);
      navbarBurger.addEventListener('click', () => {
        navbarBurger.classList.toggle('nav--active');
        nav.classList.toggle('nav--active');
      });
    }
  });

  // Close the navbar when clicking outside of it
  function clickAnywhere(e) {
    navbarBurgers.forEach((navbarBurger, i) => {
      if (navMap.has(i)) {
        const nav = navMap.get(i);
        if (!navbarBurger.contains(e.target) && !nav.contains(e.target)) {
          navbarBurger.classList.remove('nav--active');
          nav.classList.remove('nav--active');
        }
      }
    });
  }

  document.addEventListener('touchstart', clickAnywhere);
  document.addEventListener('click', clickAnywhere);
  document.addEventListener('touchend', clickAnywhere);
  document.addEventListener('mouseup', clickAnywhere);

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) {
      navbarBurgers.forEach((navbarBurger, i) => {
        if (navMap.has(i)) {
          const nav = navMap.get(i);
          navbarBurger.classList.remove('nav--active');
          nav.classList.remove('nav--active');
        }
      });
    }
  });

  const header = document.querySelector('header.header');
  if (header) header.classList.add('nav-loaded');
});
