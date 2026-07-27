// Humanize dates in Javascript so the relative "now" date doesn't depend on Hugo build time
// Uses Hugo templating to get localized strings, then dynamically calculates relative times

document.addEventListener('DOMContentLoaded', () => {
  // Get localized strings from Hugo i18n with placeholder "0"
  const strings = {
    justNow: "{{ i18n "just_now" }}",
    minutesAgo: "{{ i18n "minutes_ago" (dict "Count" 0) }}",
    hoursAgo: "{{ i18n "hours_ago" (dict "Count" 0) }}",
    daysAgo: "{{ i18n "days_ago" (dict "Count" 0) }}",
    weeksAgo: "{{ i18n "weeks_ago" (dict "Count" 0) }}",
    monthsAgo: "{{ i18n "months_ago" (dict "Count" 0) }}",
    yearsAgo: "{{ i18n "years_ago" (dict "Count" 0) }}"
  };

  /**
   * Humanize a date relative to now
   * @param {Date|string|number} date - Date object, ISO string, or Unix timestamp (seconds or milliseconds)
   * @returns {string} Humanized date string
   */
  function humanizeDate(date) {
    let dateObj;

    // Handle different input types
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'number' || typeof date === 'string') {
      const num = parseInt(date);
      if (!isNaN(num)) {
        // Handle both Unix seconds and milliseconds
        dateObj = new Date(num < 10000000000 ? num * 1000 : num);
      } else {
        dateObj = new Date(date);
      }
    }

    if (!dateObj || isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date input ${typeof date} ${date}`);
    }

    // Calculate seconds difference
    const now = new Date();
    const secs = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    // Calculate days
    const days = Math.floor(secs / 86400);

    // Apply the same logic as the Hugo partial
    if (days > 365) {
      const years = Math.floor(days / 365);
      return strings.yearsAgo.replace('0', years);
    } else if (days > 30) {
      const months = Math.floor(days / 30);
      return strings.monthsAgo.replace('0', months);
    } else if (days > 7) {
      const weeks = Math.floor(days / 7);
      return strings.weeksAgo.replace('0', weeks);
    } else if (days > 0) {
      return strings.daysAgo.replace('0', days);
    } else if (secs > 3600) {
      const hours = Math.floor(secs / 3600);
      return strings.hoursAgo.replace('0', hours);
    } else if (secs > 120) {
      const mins = Math.floor(secs / 60);
      return strings.minutesAgo.replace('0', mins);
    } else {
      return strings.justNow;
    }
  }

  /**
   * Update all elements with data-humanize-date attribute
   * The attribute value should be a date in ISO format or Unix timestamp
   */
  function updateHumanizedDates() {
    const elements = document.querySelectorAll('[data-humanize-date]');
    elements.forEach(element => {
      const dateValue = element.getAttribute('data-humanize-date');
      if (dateValue) {
        try {
          element.textContent = humanizeDate(dateValue);
        } catch (error) {
          console.error('Error humanizing date:', error, 'for value:', dateValue);
        }
      }
    });
  }

  // Expose the humanizeDate function globally
  window.humanizeDate = humanizeDate;
  window.updateHumanizedDates = updateHumanizedDates;

  // Initial update of all humanized dates on page load
  updateHumanizedDates();

  // Optional: Update dates every minute to keep them fresh
  setInterval(updateHumanizedDates, 60000);
});
