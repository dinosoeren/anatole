import FlexSearch from "flexsearch";

document.addEventListener('DOMContentLoaded', () => {
  /*! FlexSearch logic adapted from Gruvbox theme | MIT license | https://github.com/schnerring/hugo-theme-gruvbox/blob/e37181494ba57cde994384fac8ef1becd3265fd0/assets/js/flexsearch.js */
  const searchInput = document.getElementById("search__text");
  const suggestions = document.getElementById("search__suggestions");
  const search = searchInput.parentNode.parentNode;

  if (search == null || searchInput == null || suggestions == null) return;

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "/") {
      // Focus search bar with CTRL + /
      e.preventDefault();
      searchInput.focus();
    } else if (e.key === "Escape") {
      // Unfocus search bar with ESC
      searchInput.blur();
      suggestions.classList.add("search__suggestions--hidden");
    }
  });

  searchInput.addEventListener("focus", () => {
    suggestions.classList.remove("search__suggestions--hidden");
    search.classList.add("active");
  });

  function handleGlobalClick(e) {
    if (!suggestions.contains(e.target)) {
      if (!search.contains(e.target)) {
        // Hide search suggestions if clicking elsewhere
        suggestions.classList.add("search__suggestions--hidden");
        search.classList.remove("active");
      } else {
        searchInput.focus();
      }
    }
  }

  document.addEventListener("click", handleGlobalClick);
  document.addEventListener("touchstart", handleGlobalClick);

  /*! Source: https://dev.to/shubhamprakash/trap-focus-using-javascript-6a3 */
  document.addEventListener("keydown", (e) => {
    const suggestionsHidden = suggestions.classList.contains(
      "search__suggestions--hidden",
    );
    if (suggestionsHidden) return;

    const focusableSuggestions = [...suggestions.querySelectorAll("a")];
    if (focusableSuggestions.length === 0) return;

    const currentIndex = focusableSuggestions.indexOf(document.activeElement);

    if (e.key === "ArrowDown") {
      // Focus next suggestion
      e.preventDefault();
      const nextIndex =
        currentIndex + 1 < focusableSuggestions.length
          ? currentIndex + 1
          : currentIndex;
      focusableSuggestions[nextIndex].focus();
    } else if (e.key === "ArrowUp") {
      // Focus previous suggestion
      e.preventDefault();
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      focusableSuggestions[nextIndex].focus();
    }
  });

  /*! The FlexSearch implementation is inspired by the Doks theme | MIT license | https://github.com/thuliteio/doks-core/blob/eb9f50cee0eeae5d72f3751951f30cf914144bc0/assets/js/flexsearch.js */
  (function () {
    const index = FlexSearch.Document({
      tokenize: "forward",
      document: {
        id: "id",
        index: [
          { field: "title" },
          { field: "tags" },
          { field: "content" },
          {
            field: "date",
            tokenize: "strict",
            encode: false,
          },
        ],
        store: ["title", "summary", "date", "lastmod", "permalink", "thumbnail"],
      },
    });

    // build index
    fetch("/search-index.json")
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        data.forEach(function (item) {
          index.add(item);
        });
      });

    searchInput.addEventListener("input", function () {
      // Run search
      const maxResultsCount = {{ $.Site.Params.flexsearch.maxResultsCount | default 5 }};
      const searchText = this.value;
      const searchResults = index.search({
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
      suggestions.innerHTML = "";
      suggestions.classList.remove("search__suggestions--hidden");

      if (searchResultsMap.size === 0 && searchText) {
        const noResultsMessage = document.createElement("div");
        noResultsMessage.innerHTML = `No results for "<strong>${searchText}</strong>"`;
        noResultsMessage.classList.add("search__no-results");
        suggestions.appendChild(noResultsMessage);
        return;
      }

      for (const [permalink, searchResult] of searchResultsMap) {
        const suggestion = document.createElement("a");
        suggestion.href = permalink;
        suggestion.classList.add("search__suggestion-item");
        suggestions.appendChild(suggestion);

        const thumbnail = document.createElement("img");
        if (searchResult.thumbnail) {
          thumbnail.src = searchResult.thumbnail;
          thumbnail.alt = searchResult.title;
          thumbnail.classList.add("search__suggestion-thumbnail");
          suggestion.appendChild(thumbnail);
        }

        const title = document.createElement("div");
        title.textContent = searchResult.title;
        title.classList.add("search__suggestion-title");
        suggestion.appendChild(title);

        const separator = document.createElement("span");
        separator.textContent = "|";
        separator.classList.add("search__suggestion-separator");
        title.appendChild(separator);

        const lastmod = document.createElement("span");
        lastmod.textContent = searchResult.lastmod;
        lastmod.classList.add("search__suggestion-lastmod");
        title.appendChild(lastmod);

        if (suggestions.childElementCount === maxResultsCount) break;
      }
    });
  })();
});
