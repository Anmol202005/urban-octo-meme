module.exports = {
  WINDOW: {
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600
  },

  BROWSER: {
    DEFAULT_HOME_URL: 'browser://newtab',
    DEFAULT_SEARCH_ENGINE: 'https://www.google.com/search?q=',
    HEADER_HEIGHT: 80, // Must match CSS --header-height
    TAB_HEIGHT: 36,    // Must match CSS --tab-height
    NAV_HEIGHT: 44     // Must match CSS --nav-height
  },

  EVENTS: {
    NAVIGATE_TO: 'navigate-to',
    GO_BACK: 'go-back',
    GO_FORWARD: 'go-forward',
    REFRESH: 'refresh',
    NEW_TAB: 'new-tab',
    CLOSE_TAB: 'close-tab'
  }
};