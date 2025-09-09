document.addEventListener('DOMContentLoaded', () => {
  const filterContainer = document.querySelector('.portfolio-filter-tags');
  if (!filterContainer) return;

  const portfolioSections = document.querySelectorAll('.portfolio-section');
  const allPortfolioItems = Array.from(document.querySelectorAll('.portfolio'));
  const allTags = new Set();
  const portfolioItemTagMap = new Map();

  allPortfolioItems.forEach((item, index) => {
    const tags = (item.dataset.tags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    portfolioItemTagMap.set(index, tags);
    tags.forEach((tag) => allTags.add(tag));
    item.dataset.itemId = index;
  });

  if (allTags.size === 0) return;

  const sortedTags = Array.from(allTags).sort();

  const tagInput = document.getElementById('tag-input');
  const tagDropdown = document.getElementById('tag-dropdown');
  const selectedTagsContainer = document.getElementById('selected-tags');
  const clearButton = filterContainer.querySelector('.portfolio-filter-clear');

  let selectedTags = [];

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

  function updateDropdown() {
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
          updateDropdown();
          // Use a small timeout to ensure the DOM is updated before blurring
          setTimeout(() => {
            tagInput.blur();
          }, 100);
        });
        tagDropdown.appendChild(option);
      });
    tagDropdown.classList.toggle('hidden', tagDropdown.children.length === 0);
  }

  function addTag(tag) {
    if (!selectedTags.includes(tag)) {
      selectedTags.push(tag);
      renderSelectedTags();
      applyFilter();
      const firstVisibleSection = document.querySelector('.post:not(.hidden)');
      if (firstVisibleSection) {
        // Use a small timeout to ensure the DOM is updated before scrolling
        setTimeout(() => {
          const portfolioTop = firstVisibleSection.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: portfolioTop, behavior: 'smooth' });
        }, 100);
      }
    }
  }

  function removeTag(tag) {
    selectedTags = selectedTags.filter((t) => t !== tag);
    renderSelectedTags();
    applyFilter();
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

  function applyFilter() {
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
      section.parentElement.classList.toggle('hidden', visibleItems === 0);
    });
    updateDropdown();
    renderSelectedTags();
  }

  tagInput.addEventListener('input', updateDropdown);
  tagInput.addEventListener('focus', updateDropdown);

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
      updateDropdown();
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
    renderSelectedTags();
    applyFilter();
  });

  applyFilter(); // Initial filter application
  tagDropdown.classList.add('hidden');
});
