window.REQUIRED_CODE_ERROR_MESSAGE = 'Please choose a country code';
window.LOCALE = 'en';
window.EMAIL_INVALID_MESSAGE = window.SMS_INVALID_MESSAGE =
  'The information provided is invalid. Please review the field format and try again.';

window.REQUIRED_ERROR_MESSAGE = 'This field cannot be left blank. ';

window.GENERIC_INVALID_MESSAGE = 'The information provided is invalid. Please review the field format and try again.';

window.translation = {
  common: {
    selectedList: '{quantity} list selected',
    selectedLists: '{quantity} lists selected',
    selectedOption: '{quantity} selected',
    selectedOptions: '{quantity} selected',
  },
};

var AUTOHIDE = Boolean(1);

// When brevo form container scrolls into view, load recaptcha
document.addEventListener('DOMContentLoaded', function () {
  let loadedReCaptcha = false;
  const formContainer = document.getElementById('sib-form-container');
  if (!formContainer) {
    console.warn(`Brevo form container not found, won't load recaptcha on scroll`);
    return;
  }

  function loadReCaptchaIfFormInView() {
    if (loadedReCaptcha) return;

    const scrollPosition = window.scrollY + window.innerHeight + 100; // offset for better UX

    if (formContainer && scrollPosition >= formContainer.offsetTop) {
      const scriptEl = document.createElement('script');
      scriptEl.src = 'https://www.google.com/recaptcha/api.js?hl=en&trustedtypes=true';

      let parent = formContainer.parentNode;
      if (parent.parentNode) parent = parent.parentNode;
      parent.appendChild(scriptEl);

      loadedReCaptcha = true;
    }
  }

  // Throttled scroll handler for better performance
  let ticking = false;
  function onScrollCheckForm() {
    if (!ticking) {
      requestAnimationFrame(() => {
        loadReCaptchaIfFormInView();
        ticking = false;
      });
      ticking = true;
    }
  }

  // Add scroll event listener
  window.addEventListener('scroll', onScrollCheckForm);
});

// Listen for email input events
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('EMAIL');
  const optinContainer = document.querySelector('.sib-optin');
  const declarationContainer = document.querySelector('.sib-form__declaration');
  const subscribeButton = document.querySelector('.sib-form-block__button');
  const optinCheckbox = document.getElementById('OPT_IN');

  if (!emailInput || !optinContainer || !declarationContainer || !subscribeButton || !optinCheckbox) {
    return;
  }

  subscribeButton.disabled = true;
  subscribeButton.classList.add('is-disabled');

  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const checkFormValidity = () => {
    const isEmailValid = validateEmail(emailInput.value);
    const isOptinChecked = optinCheckbox.checked;

    if (isEmailValid) {
      optinContainer.classList.add('is-visible');
      declarationContainer.classList.add('is-visible');
    } else {
      optinContainer.classList.remove('is-visible');
      declarationContainer.classList.remove('is-visible');
    }

    if (isEmailValid && isOptinChecked) {
      subscribeButton.disabled = false;
      subscribeButton.classList.remove('is-disabled');
    } else {
      subscribeButton.disabled = true;
      subscribeButton.classList.add('is-disabled');
    }
  };

  emailInput.addEventListener('input', checkFormValidity);
  optinCheckbox.addEventListener('change', checkFormValidity);
});
