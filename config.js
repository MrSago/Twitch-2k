const CONFIG = {
  DEFAULT_PROXY_ADDRESS: "azaska.ru",
  DEFAULT_PROXY_PORT: "1050",
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
} else if (typeof self !== "undefined") {
  self.CONFIG = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
