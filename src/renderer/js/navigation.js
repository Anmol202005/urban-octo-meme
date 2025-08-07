class NavigationManager {
    constructor() {
        this.currentUrl = '';
        this.currentTitle = 'New Tab';
        this.isLoading = false;
        this.canGoBack = false;
        this.canGoForward = false;

        this.initializeElements();
        this.setupEventListeners();
        this.setupIpcListeners();
    }

    initializeElements() {
        this.backBtn = document.getElementById('back-btn');
        this.forwardBtn = document.getElementById('forward-btn');
        this.refreshBtn = document.getElementById('refresh-btn');
        this.urlBar = document.getElementById('url-bar');
        this.contentArea = document.getElementById('content');

        if (!this.backBtn || !this.forwardBtn || !this.refreshBtn || !this.urlBar || !this.contentArea) {
            throw new Error('Required navigation elements not found in DOM');
        }
    }

    setupEventListeners() {
        // URL bar events
        this.urlBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigateToUrl(this.urlBar.value.trim());
            }
        });

        this.urlBar.addEventListener('focus', () => {
            this.urlBar.select();
        });

        // Navigation button events
        this.backBtn.addEventListener('click', () => this.goBack());
        this.forwardBtn.addEventListener('click', () => this.goForward());
        this.refreshBtn.addEventListener('click', () => this.handleRefreshClick());

        // Handle quick search from welcome screen
        const quickSearch = document.getElementById('quick-search');
        if (quickSearch) {
            quickSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.navigateToUrl(quickSearch.value.trim());
                }
            });
        }
    }

    setupIpcListeners() {
        // Listen for tab events from main process
        if (typeof window !== 'undefined' && window.electronAPI) {
            // Tab loading events
            window.electronAPI.onTabLoadingStarted((data) => {
                this.setLoading(true);
            });

            window.electronAPI.onTabLoadingStopped((data) => {
                this.setLoading(false);
            });

            window.electronAPI.onTabLoaded((data) => {
                this.canGoBack = data.canGoBack;
                this.canGoForward = data.canGoForward;
                this.updateNavigationButtons();
            });

            window.electronAPI.onTabUrlUpdated((data) => {
                this.currentUrl = data.url;
                this.urlBar.value = data.url;
            });

            window.electronAPI.onTabTitleUpdated((data) => {
                this.currentTitle = data.title;
                document.title = data.title;
            });

            window.electronAPI.onTabActivated((data) => {
                this.currentUrl = data.url;
                this.currentTitle = data.title;
                this.canGoBack = data.canGoBack;
                this.canGoForward = data.canGoForward;
                this.isLoading = data.loading;

                this.urlBar.value = data.url;
                document.title = data.title;
                this.updateNavigationButtons();
                this.setLoading(data.loading);

                // Hide welcome screen when tab is active
                this.hideWelcomeScreen();
            });

            window.electronAPI.onTabCreated((data) => {
                // Hide welcome screen when first tab is created
                this.hideWelcomeScreen();
            });
        }
    }

    async navigateToUrl(input) {
        if (!input) return;

        try {
            // Use IPC to tell main process to navigate
            await window.electronAPI.navigateUrl(input);

            // Update UI immediately for responsiveness
            this.urlBar.value = input;
            this.setLoading(true);

        } catch (error) {
            console.error('Navigation failed:', error);
            this.showError('Failed to navigate to URL');
        }
    }

    async goBack() {
        try {
            await window.electronAPI.tabGoBack();
        } catch (error) {
            console.error('Go back failed:', error);
        }
    }

    async goForward() {
        try {
            await window.electronAPI.tabGoForward();
        } catch (error) {
            console.error('Go forward failed:', error);
        }
    }

    async handleRefreshClick() {
        if (this.isLoading) {
            // Stop loading
            try {
                await window.electronAPI.tabStop();
            } catch (error) {
                console.error('Stop loading failed:', error);
            }
        } else {
            // Refresh
            try {
                await window.electronAPI.tabReload();
            } catch (error) {
                console.error('Reload failed:', error);
            }
        }
    }

    updateNavigationButtons() {
        this.backBtn.disabled = !this.canGoBack;
        this.forwardBtn.disabled = !this.canGoForward;
    }

    setLoading(loading) {
        this.isLoading = loading;

        if (loading) {
            this.contentArea.classList.add('loading');
            this.refreshBtn.textContent = '×';
            this.refreshBtn.title = 'Stop loading';
        } else {
            this.contentArea.classList.remove('loading');
            this.refreshBtn.textContent = '↻';
            this.refreshBtn.title = 'Refresh';
        }
    }

    hideWelcomeScreen() {
        const welcomeScreen = document.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
    }

    showWelcomeScreen() {
        const welcomeScreen = document.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
        }
    }

    showError(message) {
        console.error(message);

        // Create error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
    `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    // Public API
    getCurrentUrl() {
        return this.currentUrl;
    }

    getCurrentTitle() {
        return this.currentTitle;
    }

    getLoadingState() {
        return this.isLoading;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavigationManager;
}
