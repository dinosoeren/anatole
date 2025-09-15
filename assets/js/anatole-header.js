document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('header.header');
  const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  const navMap = new Map();

  if (navbarBurgers.length < 1) return;

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

  header.classList.add('nav-loaded');
});
