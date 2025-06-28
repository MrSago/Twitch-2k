importScripts("config.js");

let DEFAULT_PROXY_ADDRESS = "azaska.ru";
let DEFAULT_PROXY_PORT = "1050";

if (typeof self.CONFIG !== "undefined") {
  DEFAULT_PROXY_ADDRESS = self.CONFIG.DEFAULT_PROXY_ADDRESS;
  DEFAULT_PROXY_PORT = self.CONFIG.DEFAULT_PROXY_PORT;
}

const DEFAULT_PROXY = {
  enabled: true,
  address: DEFAULT_PROXY_ADDRESS,
  port: DEFAULT_PROXY_PORT,
  useAuth: false,
  useCustomProxy: false,
};

let proxyConfig = { ...DEFAULT_PROXY };

chrome.storage.sync
  .get(["proxyConfig"])
  .then((result) => {
    if (result.proxyConfig) {
      proxyConfig = result.proxyConfig;
      if (proxyConfig.enabled) {
        applyProxySettings();
      }
    }
  })
  .catch((error) => {
    console.error(getMessage("errorLoadingSettings") + ":", error);
  });

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.proxyConfig) {
    proxyConfig = changes.proxyConfig.newValue;
    if (proxyConfig.enabled) {
      applyProxySettings();
    } else {
      disableProxy();
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ proxyConfig: DEFAULT_PROXY }).catch((error) => {
    console.error(getMessage("errorInitializingSettings") + ":", error);
  });
});

function getMessage(key) {
  return chrome.i18n.getMessage(key) || key;
}

function generatePacScript() {
  const proxyAddress = proxyConfig.useCustomProxy
    ? proxyConfig.address
    : DEFAULT_PROXY_ADDRESS;
  const proxyPort = proxyConfig.useCustomProxy
    ? proxyConfig.port
    : DEFAULT_PROXY_PORT;
  const proxyString = `PROXY ${proxyAddress}:${proxyPort}`;

  return `function FindProxyForURL(url, host) {
    if (shExpMatch(host, "gql.twitch.tv") || shExpMatch(host, "usher.ttvnw.net")) {
      return '${proxyString}';
    }
    
    return 'DIRECT';
  }`;
}

function applyProxySettings() {
  const pacScript = generatePacScript();

  const proxySettings = {
    mode: "pac_script",
    pacScript: {
      data: pacScript,
    },
  };

  chrome.proxy.settings.set(
    {
      value: proxySettings,
      scope: "regular",
    },
    () => {
      if (chrome.runtime.lastError) {
        console.error(
          getMessage("errorApplyingProxySettings") + ":",
          chrome.runtime.lastError
        );
      } else {
        console.log(getMessage("proxySettingsApplied"));
      }
    }
  );
}

function disableProxy() {
  chrome.proxy.settings.clear({ scope: "regular" }, () => {
    if (chrome.runtime.lastError) {
      console.error(
        getMessage("errorClearingProxySettings") + ":",
        chrome.runtime.lastError
      );
    } else {
      console.log(getMessage("proxySettingsCleared"));
    }
  });
}
