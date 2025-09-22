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
    store: ['title', 'summary', 'date', 'dateunix', 'permalink', 'thumbnailImg', 'thumbnailUrl'],
  },
});

function fetchAndBuildIndex() {
  return fetch('/search-index.json')
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      data.forEach(function (item) {
        const wordFreq = item.content?.topWords ?? {};
        // Repeat words based on their frequency to improve search relevance
        const words = Object.keys(wordFreq).reduce((arr, word) => {
          arr.push(...Array(wordFreq[word]).fill(word));
          return arr;
        }, []);
        const doc = {
          ...item,
          content: [
            item.content?.plain ?? '',
            (words ?? []).join(' '),
            (item.content?.headings ?? []).join(' '),
            (item.content?.sentences ?? []).join(' '),
            (item.content?.paragraphWords ?? []).join(' '),
          ].join(' '),
        };
        flexSearchIndex.add(doc);
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
  let suggestions = container.querySelector('.search__suggestions');
  if (suggestions == null && container.dataset.suggestionsTarget) {
    suggestions = document.getElementById(container.dataset.suggestionsTarget);
  }

  if (searchInput == null || suggestions == null) return;

  // Remove existing no results suggestion (e.g. 'Loading') if present
  const preExistingMessage = suggestions.querySelector('.search__no-results');
  if (preExistingMessage) {
    preExistingMessage.parentNode?.removeChild(preExistingMessage);
  }

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

  function executeSearch() {
    // Run search
    const maxResultsCount = Number(container.dataset.maxResults || 5);
    const searchText = searchInput.value;
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

    requestAnimationFrame(() => renderSearchResults(searchText, searchResultsMap, maxResultsCount));
  }

  function renderSearchResults(searchText, searchResultsMap, maxResultsCount) {
    if (!suggestions) return;
    // Clear old results before rendering new ones
    const oldResults = suggestions.querySelectorAll('.search__suggestions-item:not(.related), .search__no-results');
    oldResults.forEach((item) => item.parentNode?.removeChild(item));

    // Hide or unhide related posts (if any) based on whether we have search results or not
    const related = suggestions.querySelectorAll('.search__suggestions-item.related');
    if (searchResultsMap.size === 0) {
      related.forEach((item) => item.classList.remove('hidden'));
    } else {
      related.forEach((item) => item.classList.add('hidden'));
    }
    suggestions.classList.remove('search__suggestions--hidden');

    if (searchResultsMap.size === 0 && searchText) {
      const noResultsMessage = document.createElement('div');
      noResultsMessage.innerHTML = `No results for "<strong>${searchText}</strong>"`;
      noResultsMessage.classList.add('search__no-results');
      if (related && related.length > 0) {
        suggestions.insertBefore(noResultsMessage, related[0]);
      } else {
        suggestions.appendChild(noResultsMessage);
      }
      return;
    }

    for (const [permalink, searchResult] of searchResultsMap) {
      const suggestion = document.createElement('a');
      suggestion.href = permalink;
      suggestion.classList.add('search__suggestions-item');
      suggestions.appendChild(suggestion);

      const thumbnail = document.createElement('img');
      if (searchResult.thumbnailImg && Object.keys(searchResult.thumbnailImg).length > 0) {
        // Reconstruct img element from extracted attributes
        if (searchResult.thumbnailImg.src) {
          thumbnail.src = searchResult.thumbnailImg.src;
        }
        if (searchResult.thumbnailImg.srcset) {
          thumbnail.srcset = searchResult.thumbnailImg.srcset;
        }
        if (searchResult.thumbnailImg.sizes) {
          thumbnail.sizes = searchResult.thumbnailImg.sizes;
        }
        if (searchResult.thumbnailImg.alt) {
          thumbnail.alt = searchResult.thumbnailImg.alt;
        }
        if (searchResult.thumbnailImg.class) {
          thumbnail.className = searchResult.thumbnailImg.class;
        }
        if (searchResult.thumbnailImg.width) {
          thumbnail.width = searchResult.thumbnailImg.width;
        }
        if (searchResult.thumbnailImg.height) {
          thumbnail.height = searchResult.thumbnailImg.height;
        }
        suggestion.appendChild(thumbnail);
      } else if (searchResult.thumbnailUrl) {
        thumbnail.src = searchResult.thumbnailUrl;
        thumbnail.alt = searchResult.title;
        thumbnail.width = 40;
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
  }

  searchInput.addEventListener('input', executeSearch);
  // Execute search if user typed something before js loaded
  if (searchInput.value) executeSearch();
}
