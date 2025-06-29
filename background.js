importScripts("config.js");

let DEFAULT_PROXY_ADDRESS = "azaska.ru";
let DEFAULT_PROXY_PORT = "1050";
let GITHUB_REPO = "MrSago/Twitch-2k";
let UPDATE_CHECK_INTERVAL = 24 * 60;

if (typeof self.CONFIG !== "undefined") {
  DEFAULT_PROXY_ADDRESS = self.CONFIG.DEFAULT_PROXY_ADDRESS;
  DEFAULT_PROXY_PORT = self.CONFIG.DEFAULT_PROXY_PORT;
  GITHUB_REPO = self.CONFIG.GITHUB_REPO;
  UPDATE_CHECK_INTERVAL = self.CONFIG.UPDATE_CHECK_INTERVAL;
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

  setupUpdateCheck();

  performUpdateCheck();
});

function getMessage(key, substitutions) {
  return chrome.i18n.getMessage(key, substitutions) || key;
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

const CURRENT_VERSION = chrome.runtime.getManifest().version;

async function checkForUpdates() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const latestVersion = data.tag_name.replace(/^v/, "");

    return {
      hasUpdate: compareVersions(latestVersion, CURRENT_VERSION) > 0,
      latestVersion: latestVersion,
      currentVersion: CURRENT_VERSION,
      releaseUrl: data.html_url,
    };
  } catch (error) {
    console.error(getMessage("errorCheckingUpdates") + ":", error);
    throw error;
  }
}

function compareVersions(version1, version2) {
  const v1parts = version1.split(".").map(Number);
  const v2parts = version2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;

    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }

  return 0;
}

async function performUpdateCheck() {
  try {
    const updateInfo = await checkForUpdates();

    chrome.storage.local.set({
      updateInfo: {
        hasUpdate: updateInfo.hasUpdate,
        latestVersion: updateInfo.latestVersion,
        currentVersion: updateInfo.currentVersion,
        releaseUrl: updateInfo.releaseUrl,
        lastCheckTime: Date.now(),
      },
    });
  } catch (error) {
    console.log("Automatic update check failed:", error);

    chrome.storage.local.set({
      updateInfo: {
        hasUpdate: false,
        error: error.message,
        lastCheckTime: Date.now(),
      },
    });
  }
}

function setupUpdateCheck() {
  chrome.alarms.create("updateCheck", {
    periodInMinutes: UPDATE_CHECK_INTERVAL,
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updateCheck") {
    performUpdateCheck();
  }
});
