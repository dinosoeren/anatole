document.addEventListener('DOMContentLoaded', () => {
  const filterContainer = document.querySelector('.portfolio-filter-tags');
  if (!filterContainer) return;

  const portfolioSections = document.querySelectorAll('.portfolio-section');
  const allPortfolioItems = Array.from(document.querySelectorAll('.portfolio'));
  const allTags = new Map();
  const portfolioItemTagMap = new Map();

  allPortfolioItems.forEach((item, index) => {
    const tags = (item.dataset.tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    portfolioItemTagMap.set(index, tags);
    tags.forEach((tag) => {
      if (allTags.has(tag)) {
        allTags.set(tag, allTags.get(tag) + 1);
      } else {
        allTags.set(tag, 1);
      }
    });
    item.dataset.itemId = index;
    // Make tag anchors clickable
    const tagAnchors = item.querySelectorAll('.tag');
    tagAnchors.forEach((anchor) => {
      anchor.addEventListener('click', () => {
        if (selectedTags.includes(anchor.textContent)) {
          removeTag(anchor.textContent);
        } else {
          addTag(anchor.textContent);
        }
      });
    });
  });

  if (allTags.size === 0) return;

  const sortedTags = Array.from(allTags.keys()).sort();
  const tagFiltersUrlParam = 'tags';

  const tagInput = document.getElementById('tag-input');
  const tagDropdown = document.getElementById('tag-dropdown');
  const selectedTagsContainer = document.getElementById('selected-tags');
  const clearButton = filterContainer.querySelector('.portfolio-filter-clear');

  let selectedTags = [];

  // Helper function to update URL with current filters
  function updateURL(pushState = true) {
    const url = new URL(window.location);
    if (selectedTags.length > 0) {
      url.searchParams.set(tagFiltersUrlParam, selectedTags.join(','));
    } else {
      url.searchParams.delete(tagFiltersUrlParam);
    }

    if (pushState) {
      window.history.pushState({ filters: selectedTags }, '', url);
    } else {
      window.history.replaceState({ filters: selectedTags }, '', url);
    }
  }

  // Initialize filters from URL parameters
  function initializeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const filtersParam = urlParams.get(tagFiltersUrlParam);
    if (filtersParam) {
      const tagsFromURL = filtersParam
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      // Only add tags that exist in our available tags
      const validTags = tagsFromURL.filter((tag) => allTags.has(tag));
      selectedTags = validTags;
      updateURL(false); // Use replaceState for initial load
    }
    requestAnimationFrame(() => {
      applyFilter(true); // Initial filter application
    });
  }

  function getCoexistingTags() {
    if (selectedTags.length === 0) {
      return sortedTags;
    }

    const coexistingTags = new Set();
    allPortfolioItems.forEach((item) => {
      const itemTags = portfolioItemTagMap.get(parseInt(item.dataset.itemId));
      const matchesSelected = selectedTags.every((tag) => itemTags.includes(tag));
      if (matchesSelected) {
        itemTags.forEach((tag) => {
          if (!selectedTags.includes(tag)) {
            coexistingTags.add(tag);
          }
        });
      }
    });
    return Array.from(coexistingTags).sort();
  }

  function updateDropdown(hideDropdown = false) {
    tagDropdown.innerHTML = '';
    const filter = tagInput.value.toLowerCase();
    const availableTags = getCoexistingTags();

    availableTags
      .filter((tag) => tag.toLowerCase().includes(filter))
      .forEach((tag) => {
        const option = document.createElement('div');
        option.textContent = tag;
        option.classList.add('dropdown-option');
        option.addEventListener('click', () => {
          addTag(tag);
          tagInput.value = '';
          // Use a small timeout to ensure the DOM is updated before blurring
          setTimeout(() => {
            tagInput.blur();
          }, 100);
        });
        const count = document.createElement('span');
        count.textContent = '(' + allTags.get(tag) + ')';
        option.appendChild(count);
        tagDropdown.appendChild(option);
      });

    if (hideDropdown === true) {
      tagDropdown.classList.add('hidden');
    } else {
      showDropdown();
    }
  }

  function showDropdown() {
    tagDropdown.classList.toggle('hidden', tagDropdown.children.length === 0);
  }

  function addTag(tag) {
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
      updateURL();
      requestAnimationFrame(() => {
        applyFilter(true);
        const firstVisibleSection = document.querySelector('.portfolio-section:not(.hidden)');
        if (firstVisibleSection) {
          // Use a small timeout to ensure the DOM is updated before scrolling
          setTimeout(() => {
            let firstPostEl = firstVisibleSection.previousElementSibling;
            while (firstPostEl && firstPostEl.previousElementSibling) {
              firstPostEl = firstPostEl.previousElementSibling;
            }
            firstPostEl.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest',
            });
          }, 100);
        }
      });
    }
  }

  function removeTag(tag) {
    selectedTags = selectedTags.filter((t) => t !== tag);
    updateURL();
    requestAnimationFrame(() => applyFilter(true));
  }

  function renderSelectedTags() {
    const existingTags = selectedTagsContainer.querySelectorAll('.selected-tag');
    existingTags.forEach((tag) => {
      tag.parentNode.removeChild(tag);
    });
    selectedTags.forEach((tag) => {
      const tagElement = document.createElement('div');
      tagElement.classList.add('selected-tag');
      tagElement.textContent = tag;
      const removeButton = document.createElement('span');
      removeButton.textContent = 'x';
      removeButton.classList.add('remove-tag');
      removeButton.addEventListener('click', () => removeTag(tag));
      tagElement.appendChild(removeButton);
      selectedTagsContainer.insertBefore(tagElement, tagInput);
    });
    if (selectedTags.length === 0) {
      clearButton.setAttribute('disabled', 'true');
    } else {
      clearButton.removeAttribute('disabled');
    }
  }

  const tocLinks = document.querySelectorAll('.table-of-contents a');

  function applyFilter(hideDropdown = false) {
    renderSelectedTags();
    portfolioSections.forEach((section) => {
      let visibleItems = 0;
      const portfolioItems = section.querySelectorAll('.portfolio');
      portfolioItems.forEach((item) => {
        const itemTags = portfolioItemTagMap.get(parseInt(item.dataset.itemId));
        const isVisible = selectedTags.length === 0 || selectedTags.every((tag) => itemTags.includes(tag));
        item.classList.toggle('hidden', !isVisible);
        if (isVisible) {
          visibleItems++;
        }
      });
      section.classList.toggle('hidden', visibleItems === 0);
      section.parentElement.classList.toggle('hidden', visibleItems === 0);
    });
    tocLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const sectionId = decodeURIComponent(href.substring(1));
        const section = document.getElementById(sectionId);
        if (!section) {
          console.error('No section found for ID:', sectionId);
        } else if (section.classList.contains('hidden') || section.parentElement.classList.contains('hidden')) {
          link.classList.add('hidden');
        } else {
          link.classList.remove('hidden');
        }
      }
    });
    updateDropdown(hideDropdown);
  }

  tagInput.addEventListener('input', () => requestAnimationFrame(updateDropdown));
  tagInput.addEventListener('focus', () => requestAnimationFrame(showDropdown));

  tagInput.addEventListener('keydown', (e) => {
    const options = Array.from(tagDropdown.querySelectorAll('.dropdown-option'));
    const focusedOption = tagDropdown.querySelector('.dropdown-option.focused');
    let focusedIndex = options.indexOf(focusedOption);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (focusedOption) {
        focusedOption.classList.remove('focused');
        focusedIndex = (focusedIndex + 1) % options.length;
      } else {
        focusedIndex = 0;
      }
      options[focusedIndex].classList.add('focused');
      tagDropdown.scrollTo({ top: focusedIndex * options[focusedIndex].scrollHeight });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (focusedOption) {
        focusedOption.classList.remove('focused');
        focusedIndex = (focusedIndex - 1 + options.length) % options.length;
      } else {
        focusedIndex = options.length - 1;
      }
      options[focusedIndex].classList.add('focused');
      tagDropdown.scrollTo({ top: focusedIndex * options[focusedIndex].scrollHeight });
    } else if (e.key === 'Enter' && focusedOption) {
      e.preventDefault();
      addTag(focusedOption.textContent);
      tagInput.value = '';
      updateDropdown(true);
      tagDropdown.scrollTo({ top: 0 });
      setTimeout(() => tagInput.focus(), 100);
    } else if (e.key === 'Backspace' && tagInput.value === '' && selectedTags.length > 0) {
      e.preventDefault();
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  });

  document.addEventListener('click', (e) => {
    if (!tagDropdown.contains(e.target) && !tagInput.contains(e.target)) {
      tagDropdown.classList.add('hidden');
    }
    if (selectedTagsContainer.parentElement.contains(e.target)) {
      tagInput.focus();
    }
  });

  clearButton.addEventListener('click', () => {
    selectedTags = [];
    updateURL();
    requestAnimationFrame(applyFilter);
  });

  // Handle browser back/forward navigation
  window.addEventListener('popstate', (event) => {
    if (event.state && event.state.filters) {
      selectedTags = event.state.filters;
    } else {
      // Parse from URL if no state
      const urlParams = new URLSearchParams(window.location.search);
      const filtersParam = urlParams.get(tagFiltersUrlParam);
      if (filtersParam) {
        const tagsFromURL = filtersParam
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);
        selectedTags = tagsFromURL.filter((tag) => allTags.has(tag));
      } else {
        selectedTags = [];
      }
    }
    requestAnimationFrame(() => applyFilter(true));
  });

  // Initialize from URL and apply initial filter
  initializeFromURL();
});
