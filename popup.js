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

  function getMessage(key) {
    return chrome.i18n.getMessage(key) || key;
  }

  updateUILanguage();

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

  setThemeBasedOnBrowserPreference();

  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", setThemeBasedOnBrowserPreference);
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
    if (useCustomProxy) {
      customProxyFields.classList.remove("hidden");
    } else {
      customProxyFields.classList.add("hidden");
    }
  }

  function saveSettings() {
    const proxyConfig = {
      enabled: isProxyEnabled,
      address: useCustomProxy ? proxyAddressInput.value : "azaska.ru",
      port: useCustomProxy ? proxyPortInput.value : "1050",
      useAuth: false,
      useCustomProxy: useCustomProxy,
    };

    chrome.storage.sync.set({ proxyConfig: proxyConfig }, function () {
      updateToggleButton(proxyConfig.enabled);
      notificationHint.textContent =
        window.reloadProxySettingsMessage || getMessage("reloadHint");
      notificationHint.classList.remove("hidden");
    });
  }

  chrome.storage.sync.get(["proxyConfig"], function (result) {
    if (result.proxyConfig) {
      isProxyEnabled = result.proxyConfig.enabled;
      useCustomProxy = result.proxyConfig.useCustomProxy || false;
      proxyAddressInput.value = result.proxyConfig.address;
      proxyPortInput.value = result.proxyConfig.port;

      updateToggleButton(isProxyEnabled);
      useCustomProxyCheckbox.checked = useCustomProxy;
      updateCustomProxyFields();
    } else {
      isProxyEnabled = false;
      useCustomProxy = false;
      proxyAddressInput.value = "azaska.ru";
      proxyPortInput.value = "1050";
      useCustomProxyCheckbox.checked = false;
      updateToggleButton(false);
      updateCustomProxyFields();
    }

    notificationHint.classList.add("hidden");
  });

  toggleProxyButton.addEventListener("click", function () {
    isProxyEnabled = !isProxyEnabled;
    saveSettings();
  });

  useCustomProxyCheckbox.addEventListener("change", function () {
    useCustomProxy = useCustomProxyCheckbox.checked;
    updateCustomProxyFields();
    saveSettings();
  });

  proxyAddressInput.addEventListener("input", saveSettings);
  proxyPortInput.addEventListener("input", saveSettings);
});
