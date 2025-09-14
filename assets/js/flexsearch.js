import FlexSearch from 'flexsearch';

/*! The FlexSearch implementation is inspired by the Doks theme | MIT license | https://github.com/thuliteio/doks-core/blob/eb9f50cee0eeae5d72f3751951f30cf914144bc0/assets/js/flexsearch.js */
const flexSearchIndex = FlexSearch.Document({
  tokenize: 'forward',
  document: {
    id: 'id',
    index: [
      { field: 'title' },
      { field: 'tags' },
      { field: 'content' },
      {
        field: 'date',
        tokenize: 'strict',
        encode: false,
      },
    ],
    store: ['title', 'summary', 'date', 'dateunix', 'permalink', 'thumbnail'],
  },
});

function fetchAndBuildIndex() {
  return fetch('/search-index.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      data.forEach(function (item) {
        flexSearchIndex.add(item);
      });
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const searchContainers = document.querySelectorAll('.search');

  if (!searchContainers || searchContainers.length === 0) return;

  fetchAndBuildIndex().then(() => {
    searchContainers.forEach((container) => {
      initSearch(container);
    });
  });
});

/*! FlexSearch logic adapted from Gruvbox theme | MIT license | https://github.com/schnerring/hugo-theme-gruvbox/blob/e37181494ba57cde994384fac8ef1becd3265fd0/assets/js/flexsearch.js */
function initSearch(container) {
  const searchInput = container.querySelector("input[type='search']");
  const suggestions = container.querySelector('.search__suggestions');

  if (searchInput == null || suggestions == null) return;

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === '/') {
      // Focus search bar with CTRL + /
      e.preventDefault();
      searchInput.focus();
    } else if (e.key === 'Escape') {
      // Unfocus search bar with ESC
      searchInput.blur();
      suggestions.classList.add('search__suggestions--hidden');
    }
  });

  searchInput.addEventListener('focus', () => {
    suggestions.classList.remove('search__suggestions--hidden');
    container.classList.add('active');
  });

  function handleGlobalClick(e) {
    if (!suggestions.contains(e.target)) {
      if (!container.contains(e.target)) {
        // Hide search suggestions if clicking elsewhere
        suggestions.classList.add('search__suggestions--hidden');
        container.classList.remove('active');
      } else {
        searchInput.focus();
      }
    }
  }

  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('touchstart', handleGlobalClick);

  /*! Adapted from: https://dev.to/shubhamprakash/trap-focus-using-javascript-6a3 */
  document.addEventListener('keydown', (e) => {
    const suggestionsHidden = suggestions.classList.contains('search__suggestions--hidden');
    if (suggestionsHidden) return;

    const focusableSuggestions = [...suggestions.querySelectorAll('a')];
    if (focusableSuggestions.length === 0) return;

    const currentIndex = focusableSuggestions.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      // Focus next suggestion
      e.preventDefault();
      const nextIndex = currentIndex + 1 < focusableSuggestions.length ? currentIndex + 1 : currentIndex;
      focusableSuggestions[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      // Focus previous suggestion
      e.preventDefault();
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      focusableSuggestions[nextIndex].focus();
    }
  });

  searchInput.addEventListener('input', function () {
    // Run search
    const maxResultsCount = Number(container.dataset.maxResults || 5);
    const searchText = this.value;
    const searchResults = flexSearchIndex.search({
      query: searchText,
      limit: maxResultsCount,
      enrich: true,
    });

    const searchResultsMap = new Map();

    // Deduplicate search results by permalink
    for (const searchResult of searchResults.flatMap((r) => r.result)) {
      if (searchResultsMap.has(searchResult.permalink)) continue;
      searchResultsMap.set(searchResult.doc.permalink, searchResult.doc);
    }

    // Display results
    suggestions.innerHTML = '';
    suggestions.classList.remove('search__suggestions--hidden');

    if (searchResultsMap.size === 0 && searchText) {
      const noResultsMessage = document.createElement('div');
      noResultsMessage.innerHTML = `No results for "<strong>${searchText}</strong>"`;
      noResultsMessage.classList.add('search__no-results');
      suggestions.appendChild(noResultsMessage);
      return;
    }

    for (const [permalink, searchResult] of searchResultsMap) {
      const suggestion = document.createElement('a');
      suggestion.href = permalink;
      suggestion.classList.add('search__suggestions-item');
      suggestions.appendChild(suggestion);

      const thumbnail = document.createElement('img');
      if (searchResult.thumbnail) {
        thumbnail.src = searchResult.thumbnail;
        thumbnail.alt = searchResult.title;
        thumbnail.classList.add('search__suggestions-thumbnail');
        suggestion.appendChild(thumbnail);
      }

      const title = document.createElement('div');
      title.textContent = searchResult.title;
      title.classList.add('search__suggestions-title');
      suggestion.appendChild(title);

      const separator = document.createElement('span');
      separator.textContent = ' | ';
      separator.classList.add('search__suggestions-separator');
      title.appendChild(separator);

      const dateunix = document.createElement('span');
      if (typeof window.humanizeDate !== 'undefined') {
        dateunix.textContent = window.humanizeDate(searchResult.dateunix);
      }
      dateunix.setAttribute('data-humanize-date', searchResult.dateunix);
      dateunix.classList.add('search__suggestions-lastmod');
      title.appendChild(dateunix);

      if (suggestions.childElementCount === maxResultsCount) break;
    }
  });
}
