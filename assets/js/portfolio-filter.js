const tagFiltersUrlParam = 'tags';
// Portfolio filter context object to hold all constants and state
let portfolioFilterContext = null;
// Dirty b/c it includes *any* text in the URL params
let dirtySelectedFilterTags = [];
// Anchor map gets updated separately from context (during page load)
// so that tags are clickable before the whole page loads
const portfolioItemAnchorsInitialized = new Map();

// Helper function to update URL with current filters
function updateURL(pushState = true) {
  const url = new URL(window.location);
  if (dirtySelectedFilterTags.length > 0) {
    url.searchParams.set(tagFiltersUrlParam, dirtySelectedFilterTags.join(','));
  } else {
    url.searchParams.delete(tagFiltersUrlParam);
  }

  if (pushState) {
    window.history.pushState({ filters: dirtySelectedFilterTags }, '', url);
  } else {
    window.history.replaceState({ filters: dirtySelectedFilterTags }, '', url);
  }
}

// Initialize filters from URL parameters
function applyFilterFromURL(context, ctxCallback) {
  const urlParams = new URLSearchParams(window.location.search);
  const filtersParam = urlParams.get(tagFiltersUrlParam);
  if (filtersParam) {
    const tagsFromURL = filtersParam
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    // Add any tags that aren't already included
    const newTags = tagsFromURL.filter((tag) => !dirtySelectedFilterTags.includes(tag));
    if (newTags.length > 0) {
      dirtySelectedFilterTags = [...newTags, ...dirtySelectedFilterTags];
    }
  }
  requestAnimationFrame(() => {
    applyFilter(context, true); // Initial filter application
    updateURL(false); // Use replaceState for initial load
    ctxCallback(context);
  });
}

function getValidTags(context) {
  return dirtySelectedFilterTags.filter((tag) => context.allTags.has(tag));
}

function getCoexistingTags(context) {
  if (dirtySelectedFilterTags.length === 0) {
    return context.sortedTags;
  }

  const coexistingTags = new Set();
  context.allPortfolioItems.forEach((item) => {
    const itemTags = context.portfolioItemTagMap.get(parseInt(item.dataset.itemId));
    if (!itemTags) return;
    const matchesSelected = dirtySelectedFilterTags.every((tag) => itemTags.includes(tag));
    if (matchesSelected) {
      itemTags.forEach((tag) => {
        if (!dirtySelectedFilterTags.includes(tag)) {
          coexistingTags.add(tag);
        }
      });
    }
  });
  return Array.from(coexistingTags).sort();
}

function getTagCount(context, tag) {
  const selectedTags = getValidTags(context);
  const tagsToMatch = [...selectedTags, tag];

  let count = 0;
  context.allPortfolioItems.forEach((item) => {
    const itemTags = context.portfolioItemTagMap.get(parseInt(item.dataset.itemId));
    if (!itemTags) return;
    const matchesAllTags = tagsToMatch.every((tagToMatch) => itemTags.includes(tagToMatch));
    if (matchesAllTags) {
      count++;
    }
  });

  return count;
}

function showOrHideOptionsWithCounts(context) {
  const filter = context.tagInput.value.trim().toLowerCase();
  const coexistingTags = new Set(getCoexistingTags(context));

  Array.from(context.tagDropdown.children).forEach((option) => {
    const tag = option.textContent.split('(')[0]; // Get tag name before count
    const matchesFilter = tag.toLowerCase().includes(filter);
    const isCoexisting = coexistingTags.has(tag);

    // Show option if it matches filter and is coexisting
    const shouldShow = matchesFilter && isCoexisting;
    option.classList.toggle('hidden', !shouldShow);

    // Update count if option is visible
    if (shouldShow) {
      const countSpan = option.querySelector('span');
      if (countSpan) {
        countSpan.textContent = '(' + getTagCount(context, tag) + ')';
      }
    }
  });
}

function maybeRebuildDropdown(context, hideDropdownAfter = false) {
  const currentOptionCount = context.tagDropdown.children.length;
  const totalTagsCount = context.allTags.size;

  // Only rebuild if the number of total tags has changed
  if (currentOptionCount !== totalTagsCount) {
    // Full rebuild
    while (context.tagDropdown.firstChild) {
      context.tagDropdown.removeChild(context.tagDropdown.firstChild);
    }

    // Create options for ALL tags, not just coexisting ones
    context.sortedTags.forEach((tag) => {
      const option = document.createElement('div');
      option.textContent = tag;
      option.classList.add('dropdown-option');
      option.addEventListener('click', () => {
        context.tagInput.value = '';
        addTag(context, tag);
        setTimeout(() => {
          context.tagInput.blur();
        }, 100);
      });
      const count = document.createElement('span');
      count.textContent = '(' + getTagCount(context, tag) + ')';
      option.appendChild(count);
      context.tagDropdown.appendChild(option);
    });
  }

  // Update visibility and counts
  showOrHideOptionsWithCounts(context);

  if (hideDropdownAfter === true) {
    hideDropdown(context);
  } else {
    showDropdown(context);
  }
}

function showDropdown(context) {
  context.tagDropdown.classList.toggle('hidden', context.tagDropdown.children.length === 0);
}

function hideDropdown(context) {
  context.tagDropdown.classList.add('hidden');
}

function addTag(context, tag) {
  if (!dirtySelectedFilterTags.includes(tag)) {
    dirtySelectedFilterTags.push(tag);
    requestAnimationFrame(() => {
      applyFilter(context, true);
      updateURL();
      // Use a small timeout to ensure the DOM is updated before scrolling
      setTimeout(() => {
        const firstVisibleSection = document.querySelector('.portfolio-section:not(.hidden)');
        if (firstVisibleSection) {
          let firstPostEl = firstVisibleSection.previousElementSibling;
          while (firstPostEl && firstPostEl.previousElementSibling) {
            firstPostEl = firstPostEl.previousElementSibling;
          }
          firstPostEl.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest',
          });
        }
      }, 100);
    });
  }
}

function removeTag(context, tag) {
  dirtySelectedFilterTags = dirtySelectedFilterTags.filter((t) => t !== tag);
  requestAnimationFrame(() => {
    applyFilter(context, true);
    updateURL();
  });
}

function renderSelectedTags(context) {
  if (!context.selectedTagsContainer) return;
  const existingTags = context.selectedTagsContainer.querySelectorAll('.selected-tag');
  existingTags.forEach((tag) => {
    tag.parentNode.removeChild(tag);
  });
  const validTags = getValidTags(context);
  validTags.forEach((tag) => {
    const tagElement = document.createElement('div');
    tagElement.classList.add('selected-tag');
    tagElement.textContent = tag;
    const removeButton = document.createElement('span');
    removeButton.textContent = 'x';
    removeButton.classList.add('remove-tag');
    removeButton.addEventListener('click', () => removeTag(context, tag));
    tagElement.appendChild(removeButton);
    context.selectedTagsContainer.insertBefore(tagElement, context.tagInput);
  });
  if (validTags.length === 0) {
    context.clearButton.setAttribute('disabled', 'true');
  } else {
    context.clearButton.removeAttribute('disabled');
  }
}

function applyFilter(context, hideDropdownAfter = false) {
  renderSelectedTags(context);
  const validTags = getValidTags(context);
  context.portfolioSections.forEach((section) => {
    let visibleItems = 0;
    const portfolioItems = section.querySelectorAll('.portfolio');
    portfolioItems.forEach((item) => {
      const itemTags = context.portfolioItemTagMap.get(parseInt(item.dataset.itemId));
      if (!itemTags) return;
      const isVisible = validTags.length === 0 || validTags.every((tag) => itemTags.includes(tag));
      item.classList.toggle('hidden', !isVisible);
      if (isVisible) {
        visibleItems++;
      }
    });
    section.classList.toggle('hidden', visibleItems === 0);
    section.parentElement.classList.toggle('hidden', visibleItems === 0);
  });
  const missingSections = [];
  context.tocLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      const sectionId = decodeURIComponent(href.substring(1));
      const section = document.getElementById(sectionId);
      if (!section) {
        missingSections.push(sectionId);
      } else if (section.classList.contains('hidden') || section.parentElement.classList.contains('hidden')) {
        link.classList.add('hidden');
      } else {
        link.classList.remove('hidden');
      }
    }
  });
  if (missingSections.length > 0) {
    // Some sections were not found
  } else if (!portfolioFilterContext) {
    // All sections found! Fully initialized
    portfolioFilterContext = context;
    const loadingHint = document.getElementById('loading-portfolio-items-hint');
    if (loadingHint) {
      requestAnimationFrame(() => loadingHint.classList.add('hidden'));
    }
  }
  maybeRebuildDropdown(context, hideDropdownAfter);
}

// Initialize portfolio filter as soon as DOM elements are available
function initializeContext(ctxCallback) {
  const filterContainer = document.querySelector('.portfolio-filter-tags');
  if (!filterContainer) {
    ctxCallback(null);
    return;
  }

  // (Re)create local context object with all constants and state
  // This will become portfolioFilterContext if applyFilter() finds all
  // the sections matching all the toc links.
  const context = {
    filterContainer,
    portfolioSections: document.querySelectorAll('.portfolio-section'),
    allPortfolioItems: Array.from(document.querySelectorAll('.portfolio')),
    allTags: new Map(),
    portfolioItemTagMap: new Map(),
    sortedTags: [],
    tagInput: document.getElementById('tag-input'),
    tagDropdown: document.getElementById('tag-dropdown'),
    selectedTagsContainer: document.getElementById('selected-tags'),
    clearButton: filterContainer.querySelector('.portfolio-filter-clear'),
    tocLinks: document.querySelectorAll('.table-of-contents a'),
    selectedTags: [],
  };

  const expectedLinkTargets = context.portfolioSections.length + context.allPortfolioItems.length;
  let loadingHint = document.getElementById('loading-portfolio-items-hint');
  if (expectedLinkTargets < context.tocLinks.length && !loadingHint) {
    requestAnimationFrame(() => {
      loadingHint = document.createElement('div');
      loadingHint.id = 'loading-portfolio-items-hint';
      loadingHint.classList.add('footer', 'footer__base');
      const header = document.createElement('h2');
      header.classList.add('center', 'portfolio__title');
      header.textContent = 'Loading...';
      loadingHint.appendChild(header);
      let parent = filterContainer.parentElement;
      if (parent.parentElement) {
        parent = parent.parentElement;
      }
      parent.appendChild(loadingHint);
    });
  }

  context.allPortfolioItems.forEach((item, index) => {
    const tags = (item.dataset.tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    context.portfolioItemTagMap.set(index, tags);
    tags.forEach((tag) => {
      if (context.allTags.has(tag)) {
        context.allTags.set(tag, context.allTags.get(tag) + 1);
      } else {
        context.allTags.set(tag, 1);
      }
    });
    item.dataset.itemId = index;
    // Make tag anchors clickable
    const tagAnchors = item.querySelectorAll('.tag');
    tagAnchors.forEach((anchor, aIdx) => {
      const anchorKey = `${index}-${aIdx}`;
      if (portfolioItemAnchorsInitialized.has(anchorKey)) return;
      anchor.addEventListener('click', () => {
        const ctx = portfolioFilterContext ?? context;
        if (dirtySelectedFilterTags.includes(anchor.textContent)) {
          removeTag(ctx, anchor.textContent);
        } else {
          addTag(ctx, anchor.textContent);
        }
      });
      portfolioItemAnchorsInitialized.set(anchorKey, true);
    });
  });

  if (context.allTags.size === 0) {
    ctxCallback(context);
    return;
  }

  context.sortedTags = Array.from(context.allTags.keys()).sort();

  // Apply URL filter, possibly before DOM content is fully loaded
  applyFilterFromURL(context, ctxCallback);
}

function onContextReady(fallbackCtx) {
  // Use fallbackCtx in case not all sections were found at the end
  const context = portfolioFilterContext ?? fallbackCtx;
  const validTags = getValidTags(context);
  if (validTags.length !== dirtySelectedFilterTags.length) {
    dirtySelectedFilterTags = validTags;
    updateURL(false); // Use replaceState for correction
  }
  const loadingHint = document.getElementById('loading-portfolio-items-hint');
  if (loadingHint) {
    requestAnimationFrame(() => loadingHint.classList.add('hidden'));
  }

  context.allPortfolioItems.forEach((item, index) => {
    // Make tag anchors clickable
    const tagAnchors = item.querySelectorAll('.tag');
    tagAnchors.forEach((anchor, aIdx) => {
      const anchorKey = `${index}-${aIdx}`;
      if (portfolioItemAnchorsInitialized.has(anchorKey)) return;
      anchor.addEventListener('click', () => {
        if (dirtySelectedFilterTags.includes(anchor.textContent)) {
          removeTag(context, anchor.textContent);
        } else {
          addTag(context, anchor.textContent);
        }
      });
    });
  });

  context.tagInput.addEventListener('input', () => requestAnimationFrame(() => showOrHideOptionsWithCounts(context)));
  context.tagInput.addEventListener('focus', () => requestAnimationFrame(() => showDropdown(context)));
  context.tagInput.addEventListener('blur', () => {
    if (
      document.activeElement !== context.tagDropdown &&
      document.activeElement.parentElement !== context.tagDropdown
    ) {
      requestAnimationFrame(() => hideDropdown(context));
    }
  });

  context.tagInput.addEventListener('keydown', (e) => {
    const options = Array.from(context.tagDropdown.querySelectorAll('.dropdown-option:not(.hidden)'));
    const focusedOption = context.tagDropdown.querySelector('.dropdown-option.focused');
    let focusedIndex = options.indexOf(focusedOption);

    if (e.key === 'ArrowDown' && options.length > 0) {
      e.preventDefault();
      if (focusedOption) {
        focusedOption.classList.remove('focused');
        focusedIndex = (focusedIndex + 1) % options.length;
      } else {
        focusedIndex = 0;
      }
      options[focusedIndex].classList.add('focused');
      context.tagDropdown.scrollTo({ top: focusedIndex * options[focusedIndex].scrollHeight });
    } else if (e.key === 'ArrowUp' && options.length > 0) {
      e.preventDefault();
      if (focusedOption) {
        focusedOption.classList.remove('focused');
        focusedIndex = (focusedIndex - 1 + options.length) % options.length;
      } else {
        focusedIndex = options.length - 1;
      }
      options[focusedIndex].classList.add('focused');
      context.tagDropdown.scrollTo({ top: focusedIndex * options[focusedIndex].scrollHeight });
    } else if (e.key === 'Enter' && focusedOption) {
      e.preventDefault();
      let tag = '';
      if (focusedOption.firstChild) {
        tag = focusedOption.firstChild.textContent;
      } else {
        tag = focusedOption.textContent;
      }
      addTag(context, tag);
      context.tagInput.value = '';
      requestAnimationFrame(() => maybeRebuildDropdown(context, true));
      context.tagDropdown.scrollTo({ top: 0 });
      setTimeout(() => context.tagInput.focus(), 100);
      requestAnimationFrame(() => showDropdown(context));
    } else if (e.key === 'Backspace' && context.tagInput.value === '' && dirtySelectedFilterTags.length > 0) {
      e.preventDefault();
      removeTag(context, dirtySelectedFilterTags[dirtySelectedFilterTags.length - 1]);
      requestAnimationFrame(() => showDropdown(context));
    }
  });

  context.tagInput.addEventListener('keyup', (e) => {
    const options = Array.from(context.tagDropdown.querySelectorAll('.dropdown-option:not(.hidden)'));
    const focusedOption = context.tagDropdown.querySelector('.dropdown-option.focused');
    let focusedIndex = options.indexOf(focusedOption);

    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter' && options.length > 0) {
      if (focusedOption) {
        focusedOption.classList.remove('focused');
      }
      focusedIndex = 0;
      options[focusedIndex].classList.add('focused');
      context.tagDropdown.scrollTo({ top: focusedIndex * options[focusedIndex].scrollHeight });
    }
  });

  document.addEventListener('click', (e) => {
    if (!context.tagDropdown.contains(e.target) && !context.tagInput.contains(e.target)) {
      hideDropdown(context);
    }
    if (context.selectedTagsContainer.parentElement.contains(e.target)) {
      context.tagInput.focus();
    }
  });

  context.clearButton.addEventListener('click', () => {
    dirtySelectedFilterTags = [];
    requestAnimationFrame(() => {
      applyFilter(context);
      updateURL();
    });
    setTimeout(() => context.tagInput.focus(), 100);
  });

  // Handle browser back/forward navigation
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.filters) {
      dirtySelectedFilterTags = event.state.filters;
    } else {
      // Parse from URL if no state
      const urlParams = new URLSearchParams(window.location.search);
      const filtersParam = urlParams.get(tagFiltersUrlParam);
      if (filtersParam) {
        const tagsFromURL = filtersParam
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
        dirtySelectedFilterTags = tagsFromURL.filter((tag) => context.allTags.has(tag));
      } else {
        dirtySelectedFilterTags = [];
      }
    }
    requestAnimationFrame(() => applyFilter(context, true));
  });
}

// Function to attempt initialization with retries
function attemptInitialization() {
  if (!portfolioFilterContext) {
    initializeContext(() => {
      if (!portfolioFilterContext) {
        // Retry every 50ms until successful or DOM is fully loaded
        setTimeout(attemptInitialization, 50);
      }
    });
  }
}

// Start initialization attempts immediately
attemptInitialization();

document.addEventListener('DOMContentLoaded', () => {
  // Try to initialize if it hasn't been done yet
  if (!portfolioFilterContext) {
    initializeContext(onContextReady);
    return;
  }
  onContextReady(portfolioFilterContext);
});
