document.addEventListener('DOMContentLoaded', () => {
  const navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  const nav = document.querySelector('nav');
  if (navbarBurgers.length < 1) return;
  navbarBurgers.forEach((navbarBurger) => {
    navbarBurger.addEventListener('click', () => {
      navbarBurger.classList.toggle('nav--active');
      nav.classList.toggle('nav--active');
    });
  });

  // Close the navbar when clicking outside of it
  function clickAnywhere(e) {
    navbarBurgers.forEach((navbarBurger) => {
      if (!navbarBurger.contains(e.target) && !nav.contains(e.target)) {
        navbarBurger.classList.remove('nav--active');
        nav.classList.remove('nav--active');
      }
    });
  }

  document.addEventListener('touchstart', clickAnywhere);
  document.addEventListener('click', clickAnywhere);
  document.addEventListener('touchend', clickAnywhere);
  document.addEventListener('mouseup', clickAnywhere);
});
