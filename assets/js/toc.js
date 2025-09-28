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
    header.classList.add('toc-loaded');
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
  const scrollYErrorMargin = 30;
  const header = document.querySelector('header.header');
  const stickyFilter = document.querySelector('.portfolio-filter-tags');

  let isMobile = false;
  let fixedHeaderHeight = 0;

  function detectMobile() {
    isMobile = window.innerWidth <= 960;
    fixedHeaderHeight = isMobile ? 70 : 90;
    if (header) {
      fixedHeaderHeight = header.getBoundingClientRect().height;
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
          const sectionTop = computeSectionTop(section, fixedHeaderHeight);

          window.scrollTo({
            top: sectionTop,
            behavior: 'smooth',
          });

          // Update URL hash
          window.history.pushState(null, null, href);

          // Hide mobile TOC after clicking
          if (header) {
            header.dataset.scrollingTo = sectionTop;
            header.dataset.scrollingTarget = sectionId;
            setTimeout(() => {
              if (header.dataset.scrollingTarget) {
                header.classList.remove('expanded');
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
    const scrollPosition = window.scrollY || window.pageYOffset;

    // Handle auto-hide after scroll to element or bottom of page
    if (header && header.dataset.scrollingTarget) {
      const targetSection = document.getElementById(header.dataset.scrollingTarget);
      if (targetSection) {
        const sectionTop = computeSectionTop(targetSection, fixedHeaderHeight);
        if (
          Math.abs(scrollPosition - sectionTop) < scrollYErrorMargin ||
          scrollPosition + window.innerHeight >= document.documentElement.scrollHeight - 1
        ) {
          header.dataset.scrollingTo = '';
          header.dataset.scrollingTarget = '';
          setTimeout(() => {
            header.classList.remove('expanded');
          }, 100);
        }
      }
    }

    let currentSection = orderedSections[0][1]; // Default to first section

    // Find the current section based on scroll position
    for (let i = orderedSections.length - 1; i >= 0; i--) {
      const section = orderedSections[i][1];
      if (section.element.classList.contains('hidden') || section.element.parentElement.classList.contains('hidden'))
        continue;

      const sectionTop = computeSectionTop(section.element, fixedHeaderHeight);
      if (sectionTop > 0 && sectionTop - scrollPosition < scrollYErrorMargin) {
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
  let scrollTimeout;
  function onScroll() {
    if (scrollTimeout) {
      return;
    }
    scrollTimeout = setTimeout(() => {
      // First check if we need to correct the scroll after any elements shifted
      if (header && header.dataset.scrollingTarget && header.dataset.scrollingTo) {
        const targetSection = document.getElementById(header.dataset.scrollingTarget);
        if (targetSection) {
          const sectionTop = computeSectionTop(targetSection, fixedHeaderHeight);
          if (parseFloat(header.dataset.scrollingTo) != sectionTop) {
            header.dataset.scrollingTo = sectionTop;
            window.scrollTo({
              top: sectionTop,
              behavior: 'smooth',
            });
          }
        }
      }
      requestAnimationFrame(() => {
        highlightCurrentSection();
        scrollTimeout = undefined;
      });
    }, 100);
  }

  window.addEventListener('scroll', onScroll);

  detectMobile();
  window.addEventListener('resize', detectMobile);

  // Highlight current section on page load
  setTimeout(() => highlightCurrentSection(), 10);
}

function computeSectionTop(section, fixedHeaderHeight) {
  const scrollPosition = window.scrollY || window.pageYOffset;
  if (!section) return scrollPosition;

  let sectionTop = section.getBoundingClientRect().top + scrollPosition;
  const computedStyle = window.getComputedStyle(section);
  const marginTop = parseFloat(computedStyle.scrollMarginTop) || 0;
  if (!isNaN(marginTop) && marginTop > 0) {
    sectionTop -= marginTop;
  } else {
    sectionTop -= fixedHeaderHeight;
  }

  return sectionTop;
}
