document.addEventListener("DOMContentLoaded", function () {
  const toggleProxyButton = document.getElementById("toggleProxy");
  const proxyAddressInput = document.getElementById("proxyAddress");
  const proxyPortInput = document.getElementById("proxyPort");
  const notificationHint = document.getElementById("notificationHint");
  const proxyAddressLabel = document.getElementById("proxyAddressLabel");
  const proxyPortLabel = document.getElementById("proxyPortLabel");
  const useCustomProxyCheckbox = document.getElementById("useCustomProxy");
  const useCustomProxyLabel = document.getElementById("useCustomProxyLabel");
  const customProxyFields = document.getElementById("customProxyFields");

  let isProxyEnabled = false;
  let useCustomProxy = false;

  const DEFAULT_PROXY_ADDRESS = window.CONFIG.DEFAULT_PROXY_ADDRESS;
  const DEFAULT_PROXY_PORT = window.CONFIG.DEFAULT_PROXY_PORT;

  function getMessage(key) {
    return chrome.i18n.getMessage(key) || key;
  }

  function validateProxy(address, port) {
    const validationResult = { isValid: true, message: "" };

    if (!address || address.trim() === "") {
      validationResult.isValid = false;
      validationResult.message = getMessage("errorEmptyAddress");
      return validationResult;
    }

    const hostnameRegex =
      /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    const ipRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/;

    if (!hostnameRegex.test(address) && !ipRegex.test(address)) {
      validationResult.isValid = false;
      validationResult.message = getMessage("errorInvalidAddress");
      return validationResult;
    }

    if (!port || port.trim() === "") {
      validationResult.isValid = false;
      validationResult.message = getMessage("errorEmptyPort");
      return validationResult;
    }

    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      validationResult.isValid = false;
      validationResult.message = getMessage("errorInvalidPort");
      return validationResult;
    }

    return validationResult;
  }

  function updateToggleButton(enabled) {
    if (enabled) {
      toggleProxyButton.textContent = getMessage("proxyEnabled");
      toggleProxyButton.classList.add("toggle-enabled");
      toggleProxyButton.classList.remove("toggle-disabled");
    } else {
      toggleProxyButton.textContent = getMessage("proxyDisabled");
      toggleProxyButton.classList.add("toggle-disabled");
      toggleProxyButton.classList.remove("toggle-enabled");
    }
  }

  function updateCustomProxyFields() {
    customProxyFields.classList.toggle("hidden", !useCustomProxy);
  }

  function saveSettings() {
    if (useCustomProxy) {
      const proxyValidation = validateProxy(
        proxyAddressInput.value.trim(),
        proxyPortInput.value.trim()
      );

      if (!proxyValidation.isValid) {
        notificationHint.textContent = proxyValidation.message;
        notificationHint.classList.remove("hidden");
        return;
      }
    }

    const proxyConfig = {
      enabled: isProxyEnabled,
      address: useCustomProxy
        ? proxyAddressInput.value.trim()
        : DEFAULT_PROXY_ADDRESS,
      port: useCustomProxy ? proxyPortInput.value.trim() : DEFAULT_PROXY_PORT,
      useAuth: false,
      useCustomProxy: useCustomProxy,
    };

    chrome.storage.sync
      .set({ proxyConfig: proxyConfig })
      .then(() => {
        updateToggleButton(proxyConfig.enabled);
        notificationHint.textContent =
          window.reloadProxySettingsMessage || getMessage("reloadHint");
        notificationHint.classList.remove("hidden");
      })
      .catch((error) => {
        console.error("Error saving proxy settings:", error);
        notificationHint.textContent = getMessage("errorSavingSettings");
        notificationHint.classList.remove("hidden");
      });
  }

  function loadSettings() {
    chrome.storage.sync
      .get(["proxyConfig"])
      .then((result) => {
        if (result.proxyConfig) {
          isProxyEnabled = result.proxyConfig.enabled;
          useCustomProxy = result.proxyConfig.useCustomProxy || false;
          proxyAddressInput.value =
            result.proxyConfig.address || DEFAULT_PROXY_ADDRESS;
          proxyPortInput.value = result.proxyConfig.port || DEFAULT_PROXY_PORT;

          updateToggleButton(isProxyEnabled);
          useCustomProxyCheckbox.checked = useCustomProxy;
          updateCustomProxyFields();
        } else {
          isProxyEnabled = false;
          useCustomProxy = false;
          proxyAddressInput.value = DEFAULT_PROXY_ADDRESS;
          proxyPortInput.value = DEFAULT_PROXY_PORT;
          useCustomProxyCheckbox.checked = false;
          updateToggleButton(false);
          updateCustomProxyFields();
        }

        notificationHint.classList.add("hidden");
      })
      .catch((error) => {
        console.error("Error loading proxy settings:", error);
        notificationHint.textContent = getMessage("errorLoadingSettings");
        notificationHint.classList.remove("hidden");
      });
  }

  function updateUILanguage() {
    const extensionTitle = document.querySelector("h2");

    extensionTitle.textContent = getMessage("appName");
    useCustomProxyLabel.textContent = getMessage("useCustomProxy");
    proxyAddressLabel.textContent = getMessage("proxyAddress") + ":";
    proxyPortLabel.textContent = getMessage("proxyPort") + ":";
    window.reloadProxySettingsMessage = getMessage("reloadHint");

    if (
      !notificationHint.classList.contains("hidden") &&
      !notificationHint.textContent.includes("anguage")
    ) {
      notificationHint.textContent = window.reloadProxySettingsMessage;
    }

    toggleProxyButton.textContent = isProxyEnabled
      ? getMessage("proxyEnabled")
      : getMessage("proxyDisabled");
  }

  function setThemeBasedOnBrowserPreference() {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }

  function setupEventListeners() {
    toggleProxyButton.addEventListener("click", function () {
      if (useCustomProxy) {
        const proxyValidation = validateProxy(
          proxyAddressInput.value.trim(),
          proxyPortInput.value.trim()
        );

        if (!proxyValidation.isValid) {
          notificationHint.textContent = proxyValidation.message;
          notificationHint.classList.remove("hidden");
          return;
        }
      }

      isProxyEnabled = !isProxyEnabled;
      saveSettings();
    });

    useCustomProxyCheckbox.addEventListener("change", function () {
      useCustomProxy = useCustomProxyCheckbox.checked;
      updateCustomProxyFields();
      saveSettings();
    });

    proxyAddressInput.addEventListener("input", function () {
      if (
        !notificationHint.classList.contains("hidden") &&
        (notificationHint.textContent === getMessage("errorEmptyAddress") ||
          notificationHint.textContent === getMessage("errorInvalidAddress"))
      ) {
        notificationHint.classList.add("hidden");
      }
    });

    proxyPortInput.addEventListener("input", function () {
      if (
        !notificationHint.classList.contains("hidden") &&
        (notificationHint.textContent === getMessage("errorEmptyPort") ||
          notificationHint.textContent === getMessage("errorInvalidPort"))
      ) {
        notificationHint.classList.add("hidden");
      }
    });

    proxyAddressInput.addEventListener("blur", function () {
      if (useCustomProxy) {
        const validation = validateProxy(
          proxyAddressInput.value.trim(),
          proxyPortInput.value.trim()
        );
        if (!validation.isValid) {
          notificationHint.textContent = validation.message;
          notificationHint.classList.remove("hidden");
        }
      }
    });

    proxyPortInput.addEventListener("blur", function () {
      if (useCustomProxy) {
        const validation = validateProxy(
          proxyAddressInput.value.trim(),
          proxyPortInput.value.trim()
        );
        if (!validation.isValid) {
          notificationHint.textContent = validation.message;
          notificationHint.classList.remove("hidden");
        }
      }
    });

    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", setThemeBasedOnBrowserPreference);
    }
  }

  loadSettings();
  updateUILanguage();
  setThemeBasedOnBrowserPreference();
  setupEventListeners();
});
