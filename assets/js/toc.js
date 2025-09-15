// Table of Contents functionality
document.addEventListener('DOMContentLoaded', function () {
  const header = document.querySelector('header.header');
  const mobileTocTrigger = document.querySelector('.toc-trigger-mobile');
  const mobileTocWrapper = document.querySelector('.toc-wrapper-mobile');

  // Mobile TOC functionality
  if (header && mobileTocTrigger && mobileTocWrapper) {
    const mobileTocItems = mobileTocWrapper.querySelectorAll('li');
    if (mobileTocItems && mobileTocItems.length > 0) {
      setupMobileTOCInteraction(header, mobileTocTrigger, mobileTocWrapper);
    } else {
      mobileTocTrigger.setAttribute('disabled', true);
    }
  }

  // Initialize scroll highlighting for all TOC links
  initScrollHighlighting();
});

function setupMobileTOCInteraction(header, mobileTocTrigger, mobileTocWrapper) {
  const burgerBtn = document.querySelector('header.header a.navbar-burger');

  let hoverTimeout;

  // Mouse events for desktop hover
  function showTOC() {
    clearTimeout(hoverTimeout);
    header.classList.add('expanded');
    if (burgerBtn) {
      burgerBtn.classList.remove('nav--active');
      const navMenu = burgerBtn.nextElementSibling;
      if (navMenu) {
        navMenu.classList.remove('nav--active');
      }
    }
  }

  function hideTOC() {
    hoverTimeout = setTimeout(() => {
      header.classList.remove('expanded');
    }, 300); // Small delay to prevent flickering
  }

  mobileTocTrigger.addEventListener('mouseenter', showTOC);
  mobileTocWrapper.addEventListener('mouseenter', showTOC);
  header.addEventListener('mouseleave', hideTOC);

  // Touch events for mobile devices
  mobileTocTrigger.addEventListener('touchstart', function (e) {
    e.preventDefault();
    header.classList.toggle('expanded');
    if (burgerBtn) {
      burgerBtn.classList.remove('nav--active');
      const navMenu = burgerBtn.nextElementSibling;
      if (navMenu) {
        navMenu.classList.remove('nav--active');
      }
    }
  });

  // Close on outside tap
  document.addEventListener('touchstart', function (e) {
    if (!mobileTocWrapper.contains(e.target) && !mobileTocTrigger.contains(e.target)) {
      header.classList.remove('expanded');
    }
  });
}

function initScrollHighlighting() {
  const sectionHighlightOffsetY = 50;
  const header = document.querySelector('header.header');
  const stickyFilter = document.querySelector('.portfolio-filter-tags');

  let isMobile = false;
  let fixedHeaderHeight = 0;

  function detectMobile() {
    isMobile = window.innerWidth <= 960;
    fixedHeaderHeight = isMobile ? 70 : 90;
    if (header) {
      fixedHeaderHeight = header.getBoundingClientRect().height + 30;
    }
    if (stickyFilter) {
      fixedHeaderHeight += stickyFilter.getBoundingClientRect().height;
    }
  }

  const tocLinks = document.querySelectorAll('.table-of-contents a');
  const sections = new Map(); // map of id to struct

  // Collect all sections that have corresponding TOC links
  tocLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const sectionId = href.substring(1);
      const section = document.getElementById(sectionId);
      if (section) {
        if (sections.has(sectionId)) {
          sections.set(sectionId, {
            ...sections.get(sectionId),
            links: [...sections.get(sectionId).links, link],
          });
        } else {
          sections.set(sectionId, {
            id: sectionId,
            order: sections.size,
            element: section,
            links: [link],
          });
        }
      }

      // Add smooth scroll click handler
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = document.getElementById(sectionId);
        if (section) {
          let sectionTop = section.getBoundingClientRect().top + window.scrollY;

          // Adjust for thumbnail wrapper if present (for non-single posts)
          const isSinglePost = document.querySelectorAll('.post__content').length === 1;
          if (
            !isSinglePost &&
            section.parentNode.previousElementSibling &&
            (section.parentNode.previousElementSibling.classList.contains('post__thumbnail-wrapper') ||
              section.parentNode.previousElementSibling.classList.contains('portfolio__image-wrapper'))
          ) {
            sectionTop = section.parentNode.previousElementSibling.getBoundingClientRect().top + window.scrollY;
          }

          const scrollPosition = sectionTop - fixedHeaderHeight;
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth',
          });

          // Update URL hash for single posts
          if (isSinglePost) {
            window.history.pushState(null, null, href);
          }

          // Hide mobile TOC after clicking
          const header = document.querySelector('header.header');
          if (header && header.classList.contains('expanded')) {
            header.dataset.scrollingTo = scrollPosition;
            setTimeout(() => {
              if (header.dataset.scrollingTo) {
                header.classList.remove('expanded');
                header.dataset.scrollingTo = '';
              }
            }, 2000);
          }
        }
      });
    }
  });

  if (sections.size === 0) return;

  const orderedSections = Array.from(sections.entries()).sort((a, b) => b.order - a.order);

  // Function to highlight the current section in TOC
  function highlightCurrentSection() {
    const scrollPosition = window.scrollY + fixedHeaderHeight + sectionHighlightOffsetY;

    // Handle auto-hide after scroll to element or bottom of page
    if (
      (header &&
        header.dataset.scrollingTo &&
        Math.abs(window.scrollY - Number(header.dataset.scrollingTo)) < sectionHighlightOffsetY) ||
      (window.scrollY || window.pageYOffset) + window.innerHeight >= document.documentElement.scrollHeight - 1
    ) {
      header.classList.remove('expanded');
      header.dataset.scrollingTo = '';
    }

    let currentSection = orderedSections[0][1]; // Default to first section

    // Find the current section based on scroll position
    for (let i = orderedSections.length - 1; i >= 0; i--) {
      const section = orderedSections[i][1];
      let sectionTop = section.element.getBoundingClientRect().top + window.scrollY;

      // Adjust for thumbnail wrapper if present
      const isSinglePost = document.querySelectorAll('.post__content').length === 1;
      if (
        !isSinglePost &&
        section.element.parentNode.previousElementSibling &&
        (section.element.parentNode.previousElementSibling.classList.contains('post__thumbnail-wrapper') ||
          section.element.parentNode.previousElementSibling.classList.contains('portfolio__image-wrapper'))
      ) {
        sectionTop = section.element.parentNode.previousElementSibling.getBoundingClientRect().top + window.scrollY;
      }

      if (sectionTop > 0 && scrollPosition >= sectionTop) {
        currentSection = section;
        break;
      }
    }

    // Remove active class from all TOC links
    tocLinks.forEach((link) => {
      link.classList.remove('toc-active');
      const parentLi = link.closest('li');
      if (parentLi) {
        parentLi.classList.remove('toc-active');
      }
    });

    // Add active class to current section's TOC link
    if (currentSection && currentSection.links) {
      currentSection.links.forEach((link) => {
        link.classList.add('toc-active');
        const parentLi = link.closest('li');
        if (parentLi) {
          parentLi.classList.add('toc-active');
          parentLi.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      });
    }
  }

  // Throttled scroll handler for better performance
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        highlightCurrentSection();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll);

  detectMobile();
  window.addEventListener('resize', detectMobile);

  // Highlight current section on page load
  const isSinglePost = document.querySelectorAll('.post__content').length === 1;
  setTimeout(() => highlightCurrentSection(), isSinglePost ? 10 : 2000);
}
