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
          tagInput.focus();
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
    selectedTagsContainer.innerHTML = '';
    selectedTags.forEach((tag) => {
      const tagElement = document.createElement('div');
      tagElement.classList.add('selected-tag');
      tagElement.textContent = tag;
      const removeButton = document.createElement('span');
      removeButton.textContent = 'x';
      removeButton.classList.add('remove-tag');
      removeButton.addEventListener('click', () => removeTag(tag));
      tagElement.appendChild(removeButton);
      selectedTagsContainer.appendChild(tagElement);
    });
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
  }

  tagInput.addEventListener('input', updateDropdown);
  tagInput.addEventListener('focus', updateDropdown);

  document.addEventListener('click', (e) => {
    if (!filterContainer.contains(e.target)) {
      tagDropdown.classList.add('hidden');
    }
  });

  clearButton.addEventListener('click', () => {
    selectedTags = [];
    renderSelectedTags();
    applyFilter();
  });

  applyFilter(); // Initial filter application
});
