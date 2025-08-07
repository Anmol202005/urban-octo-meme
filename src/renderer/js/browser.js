class Browser {
    constructor() {
        this.navigationManager = null;
        this.tabUIManager = null;
        this.platform = null;
        this.isInitialized = false;

        this.init();
    }

    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Get platform info for styling
            this.platform = await this.getPlatform();
            this.applyPlatformStyles();

            // Initialize managers
            this.navigationManager = new NavigationManager();
            this.tabUIManager = new TabUIManager();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            this.isInitialized = true;
            console.log('Browser initialized successfully');

        } catch (error) {
            console.error('Failed to initialize browser:', error);
            this.showError('Failed to initialize browser');
        }
    }

    async getPlatform() {
        if (typeof window !== 'undefined' && window.electronAPI) {
            return await window.electronAPI.getPlatform();
        }
        return 'unknown';
    }

    applyPlatformStyles() {
        document.body.classList.add(`platform-${this.platform}`);
    }

    setupGlobalEventListeners() {
        // Handle window focus
        window.addEventListener('focus', () => {
            document.body.classList.add('window-focused');
        });

        window.addEventListener('blur', () => {
            document.body.classList.remove('window-focused');
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.updateConnectionStatus(true);
        });

        window.addEventListener('offline', () => {
            this.updateConnectionStatus(false);
        });

        // Handle unload
        window.addEventListener('beforeunload', (e) => {
            this.cleanup();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            if (isCtrlOrCmd) {
                switch (e.key) {
                    case 'l':
                        e.preventDefault();
                        this.focusAddressBar();
                        break;

                    case 'r':
                        e.preventDefault();
                        if (this.navigationManager) {
                            this.navigationManager.refresh();
                        }
                        break;

                    case 't':
                        e.preventDefault();
                        this.newTab();
                        break;

                    case 'w':
                        e.preventDefault();
                        this.closeCurrentTab();
                        break;

                    case 'n':
                        e.preventDefault();
                        this.newTab();
                        break;
                }
            }

            // Handle other shortcuts
            switch (e.key) {
                case 'F5':
                    e.preventDefault();
                    if (this.navigationManager) {
                        this.navigationManager.refresh();
                    }
                    break;

                case 'Escape':
                    this.handleEscape();
                    break;
            }

            // Navigation shortcuts
            if (e.altKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        if (this.navigationManager) {
                            this.navigationManager.goBack();
                        }
                        break;

                    case 'ArrowRight':
                        e.preventDefault();
                        if (this.navigationManager) {
                            this.navigationManager.goForward();
                        }
                        break;
                }
            }
        });
    }

    focusAddressBar() {
        const urlBar = document.getElementById('url-bar');
        if (urlBar) {
            urlBar.focus();
            urlBar.select();
        }
    }

    newTab(url = null) {
        if (this.tabUIManager) {
            this.tabUIManager.createNewTab(url);
        } else {
            console.log('Tab UI Manager not available');
        }
    }

    closeCurrentTab() {
        if (this.tabUIManager) {
            const activeTabId = this.tabUIManager.getActiveTabId();
            if (activeTabId) {
                this.tabUIManager.closeTab(activeTabId);
            }
        } else {
            console.log('Tab UI Manager not available');
        }
    }

    handleEscape() {
        // Stop loading if in progress
        if (this.navigationManager && this.navigationManager.isLoading) {
            // TODO: Stop loading
        }

        // Clear focus from address bar
        const urlBar = document.getElementById('url-bar');
        if (urlBar && document.activeElement === urlBar) {
            urlBar.blur();
        }
    }

    updateConnectionStatus(isOnline) {
        document.body.classList.toggle('offline', !isOnline);

        if (!isOnline) {
            this.showNotification('You are currently offline', 'warning');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            background: type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff',
            color: type === 'warning' ? '#000' : '#fff',
            padding: '12px 16px',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: '10000',
            fontSize: '14px',
            maxWidth: '300px'
        });

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showError(message) {
        console.error(message);
        this.showNotification(message, 'error');
    }

    cleanup() {
        // Cleanup resources before unload
        console.log('Browser cleanup');
    }

    // Public API methods
    navigate(url) {
        if (this.navigationManager) {
            this.navigationManager.navigateToUrl(url);
        }
    }

    goBack() {
        if (this.navigationManager) {
            this.navigationManager.goBack();
        }
    }

    goForward() {
        if (this.navigationManager) {
            this.navigationManager.goForward();
        }
    }

    refresh() {
        if (this.navigationManager) {
            this.navigationManager.handleRefreshClick();
        }
    }

    getCurrentUrl() {
        return this.navigationManager ? this.navigationManager.getCurrentUrl() : '';
    }

    getCurrentTitle() {
        return this.navigationManager ? this.navigationManager.getCurrentTitle() : '';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Browser;
}
