let proxyConfig = {
  enabled: false,
  address: "azaska.ru",
  port: "1050",
  useAuth: false,
};

chrome.storage.sync.get(["proxyConfig"], function (result) {
  if (result.proxyConfig) {
    proxyConfig = result.proxyConfig;
    if (proxyConfig.enabled) {
      applyProxySettings();
    }
  }
});

chrome.storage.onChanged.addListener(function (changes, namespace) {
  if (namespace === "sync" && changes.proxyConfig) {
    proxyConfig = changes.proxyConfig.newValue;
    if (proxyConfig.enabled) {
      applyProxySettings();
    } else {
      disableProxy();
    }
  }
});

function generatePacScript() {
  const proxyAddress = proxyConfig.useCustomProxy
    ? proxyConfig.address
    : "azaska.ru";
  const proxyPort = proxyConfig.useCustomProxy ? proxyConfig.port : "1050";
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
    function () {
      console.log("Proxy settings applied");
    }
  );
}

function disableProxy() {
  chrome.proxy.settings.clear({ scope: "regular" }, function () {
    console.log("Proxy settings cleared");
  });
}

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.set({ proxyConfig: proxyConfig });
});
