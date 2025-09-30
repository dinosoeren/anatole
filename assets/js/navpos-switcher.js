const getStoredNavPos = () => localStorage.getItem('navpos');

const setNavPos = (position) => {
  localStorage.setItem('navpos', position);
  const html = document.documentElement;
  const prevNavPos = [...html.classList].find((c) => c.match(/navpos--(top|bottom)/));
  if (prevNavPos) {
    html.classList.remove(prevNavPos);
  }
  html.classList.add(`navpos--${position}`);
  html.dataset.navpos = position;
};

const setTopNav = () => {
  setNavPos('top');
};

const setBottomNav = () => {
  setNavPos('bottom');
};

const getActiveNav = () => {
  const currNavPos = getStoredNavPos();
  if (currNavPos === 'bottom') {
    return document.querySelector('.nav--above');
  } else {
    return document.querySelector('.nav--below');
  }
};

const openNav = () => {
  const nav = getActiveNav();
  if (nav) {
    nav.classList.add('nav--active');
  }
};

const switchNavPos = () => {
  copySuggestionItems();
  const currNavPos = getStoredNavPos();
  switch (currNavPos) {
    case 'top':
      setBottomNav();
      break;
    case 'bottom':
      setTopNav();
      break;
    default:
      setTopNav();
      break;
  }
  openNav();
};

const copySuggestionItems = () => {
  // Find all search containers that might have suggestions
  const searchContainers = document.querySelectorAll('.search');

  searchContainers.forEach((container) => {
    // Get suggestion targets from dataset attributes (following flexsearch.js logic)
    const suggestionTargets = {
      above: container.dataset.suggestionsTargetAbove
        ? document.getElementById(container.dataset.suggestionsTargetAbove)
        : null,
      below: container.dataset.suggestionsTargetBelow
        ? document.getElementById(container.dataset.suggestionsTargetBelow)
        : null,
    };

    // Fallback to single target if above/below not specified
    if (!suggestionTargets.above && !suggestionTargets.below) {
      let suggestions = null;
      if (container.dataset.suggestionsTarget) {
        suggestions = document.getElementById(container.dataset.suggestionsTarget);
      } else {
        suggestions = container.querySelector('.search__suggestions');
      }
      // Determine which target this should be based on element classes
      if (suggestions && suggestions.classList.contains('search__suggestions--above')) {
        suggestionTargets.above = suggestions;
      } else {
        suggestionTargets.below = suggestions;
      }
    }

    // Skip if we don't have both targets
    if (!suggestionTargets.above || !suggestionTargets.below) {
      return;
    }

    // Determine current and new navigation positions
    const currNavPos = getStoredNavPos();
    let fromTarget, toTarget;

    // Following the same logic as flexsearch.js getActiveSuggestions()
    if (currNavPos === 'bottom') {
      // Currently bottom nav, so suggestions are in above container
      // After switch, nav will be top, so suggestions should be in below container
      fromTarget = suggestionTargets.above;
      toTarget = suggestionTargets.below;
    } else {
      // Currently top nav, so suggestions are in below container
      // After switch, nav will be bottom, so suggestions should be in above container
      fromTarget = suggestionTargets.below;
      toTarget = suggestionTargets.above;
    }

    requestAnimationFrame(() => {
      // Clear toTarget of all its child nodes
      while (toTarget.firstChild) {
        toTarget.removeChild(toTarget.firstChild);
      }
      // Copy all suggestion items from current to new target
      const itemsToMove = fromTarget.querySelectorAll('.search__suggestions-item, .search__no-results');
      itemsToMove.forEach((item) => {
        // Clone the item and append to new target
        const clonedItem = item.cloneNode(true);
        toTarget.appendChild(clonedItem);
      });
    });
  });
};

document.addEventListener(
  'DOMContentLoaded',
  () => {
    const navPosSwitchers = document.querySelectorAll('.navpos-switch');
    navPosSwitchers.forEach((switcher) => {
      switcher.addEventListener('click', switchNavPos, false);
    });
  },
  false,
);

// Initialize navbar position from stored preference or default to top
const currNavPos = getStoredNavPos();
if (currNavPos) {
  setNavPos(currNavPos);
} else {
  // Check if there's a default from Hugo config
  const htmlNavPos = document.documentElement.dataset.navpos;
  if (htmlNavPos) {
    setNavPos(htmlNavPos);
  } else {
    setTopNav();
  }
}
