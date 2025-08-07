class TabUIManager {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;

        this.initializeElements();
        this.setupEventListeners();
        this.setupIpcListeners();
    }

    initializeElements() {
        this.tabsContainer = document.getElementById('tabs-container');
        this.newTabBtn = document.getElementById('new-tab-btn');

        if (!this.tabsContainer || !this.newTabBtn) {
            throw new Error('Required tab UI elements not found');
        }
    }

    setupEventListeners() {
        // New tab button
        this.newTabBtn.addEventListener('click', () => {
            this.createNewTab();
        });

        // Handle tab container scroll with mouse wheel
        this.tabsContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.tabsContainer.scrollLeft += e.deltaY;
            this.updateScrollIndicators();
        });

        // Update scroll indicators on scroll
        this.tabsContainer.addEventListener('scroll', () => {
            this.updateScrollIndicators();
        });

        // Double click on tab bar to create new tab
        this.tabsContainer.addEventListener('dblclick', (e) => {
            if (e.target === this.tabsContainer) {
                this.createNewTab();
            }
        });
    }

    updateScrollIndicators() {
        const container = this.tabsContainer;
        const canScrollLeft = container.scrollLeft > 0;
        const canScrollRight = container.scrollLeft < container.scrollWidth - container.clientWidth;

        container.classList.toggle('scroll-left', canScrollLeft);
        container.classList.toggle('scroll-right', canScrollRight);
    }

    setupIpcListeners() {
        if (typeof window !== 'undefined' && window.electronAPI) {
            // Tab lifecycle events
            window.electronAPI.onTabCreated((data) => {
                this.addTabToUI(data);
            });

            window.electronAPI.onTabClosed((data) => {
                this.removeTabFromUI(data.tabId);
            });

            window.electronAPI.onTabActivated((data) => {
                this.setActiveTab(data.id);
            });

            // Tab content updates
            window.electronAPI.onTabTitleUpdated((data) => {
                this.updateTabTitle(data.tabId, data.title);
            });

            window.electronAPI.onTabUrlUpdated((data) => {
                this.updateTabUrl(data.tabId, data.url);
            });

            window.electronAPI.onTabLoadingStarted((data) => {
                this.setTabLoading(data.tabId, true);
            });

            window.electronAPI.onTabLoadingStopped((data) => {
                this.setTabLoading(data.tabId, false);
            });
        }
    }

    async createNewTab(url = null) {
        try {
            if (window.electronAPI) {
                await window.electronAPI.createTab(url);
            }
        } catch (error) {
            console.error('Failed to create new tab:', error);
        }
    }

    addTabToUI(tabData) {
        const tabElement = this.createTabElement(tabData);
        this.tabs.set(tabData.id, {
            element: tabElement,
            data: tabData
        });

        this.tabsContainer.appendChild(tabElement);
        this.setActiveTab(tabData.id);
    }

    createTabElement(tabData) {
        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.tabId = tabData.id;

        const favicon = document.createElement('div');
        favicon.className = 'tab-favicon';
        favicon.textContent = '🌐';

        const title = document.createElement('div');
        title.className = 'tab-title';
        title.textContent = tabData.title || 'New Tab';
        title.title = tabData.title || 'New Tab';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close';
        closeBtn.title = 'Close tab';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', 'Close tab');
        // Use CSS-only approach for better hover behavior
        closeBtn.innerHTML = '';  // Empty - styled with CSS pseudo-elements

        // Audio indicator (for future use)
        const audioIndicator = document.createElement('div');
        audioIndicator.className = 'tab-audio';
        audioIndicator.textContent = '🔊';

        // Event listeners
        tab.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchToTab(tabData.id);
            }
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tabData.id);
        });

        // Middle click to close
        tab.addEventListener('mousedown', (e) => {
            if (e.button === 1) { // Middle mouse button
                e.preventDefault();
                this.closeTab(tabData.id);
            }
        });

        // Prevent context menu for cleaner look
        tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        tab.appendChild(favicon);
        tab.appendChild(title);
        tab.appendChild(audioIndicator);
        tab.appendChild(closeBtn);

        return tab;
    }

    removeTabFromUI(tabId) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            tab.element.remove();
            this.tabs.delete(tabId);

            if (this.activeTabId === tabId) {
                this.activeTabId = null;
            }
        }
    }

    async switchToTab(tabId) {
        try {
            if (window.electronAPI) {
                await window.electronAPI.switchTab(tabId);
            }
        } catch (error) {
            console.error('Failed to switch tab:', error);
        }
    }

    async closeTab(tabId) {
        try {
            if (window.electronAPI) {
                await window.electronAPI.closeTab(tabId);
            }
        } catch (error) {
            console.error('Failed to close tab:', error);
        }
    }

    setActiveTab(tabId) {
        // Remove active class from all tabs
        this.tabs.forEach((tab) => {
            tab.element.classList.remove('active');
        });

        // Add active class to current tab
        const activeTab = this.tabs.get(tabId);
        if (activeTab) {
            activeTab.element.classList.add('active');
            this.activeTabId = tabId;

            // Scroll tab into view if needed
            this.scrollTabIntoView(activeTab.element);
        }
    }

    updateTabTitle(tabId, title) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            const titleElement = tab.element.querySelector('.tab-title');
            const displayTitle = title || 'New Tab';
            titleElement.textContent = displayTitle;
            titleElement.title = displayTitle;

            // Update stored data
            tab.data.title = title;
        }
    }

    updateTabUrl(tabId, url) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            // Update favicon based on URL
            const favicon = tab.element.querySelector('.tab-favicon');
            if (url.includes('github.com')) {
                favicon.textContent = '🐙';
            } else if (url.includes('google.com')) {
                favicon.textContent = '🔍';
            } else if (url.includes('stackoverflow.com')) {
                favicon.textContent = '📚';
            } else if (url.includes('youtube.com')) {
                favicon.textContent = '📺';
            } else if (url.includes('twitter.com') || url.includes('x.com')) {
                favicon.textContent = '🐦';
            } else {
                favicon.textContent = '🌐';
            }

            // Update stored data
            tab.data.url = url;
        }
    }

    setTabLoading(tabId, loading) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            const favicon = tab.element.querySelector('.tab-favicon');

            if (loading) {
                tab.element.classList.add('loading');
                favicon.classList.add('loading');
                favicon.textContent = '⟳';
            } else {
                tab.element.classList.remove('loading');
                favicon.classList.remove('loading');
                // Restore favicon based on URL
                this.updateTabUrl(tabId, tab.data.url);
            }
        }
    }

    scrollTabIntoView(tabElement) {
        const container = this.tabsContainer;
        const containerRect = container.getBoundingClientRect();
        const tabRect = tabElement.getBoundingClientRect();

        if (tabRect.left < containerRect.left) {
            container.scrollLeft -= containerRect.left - tabRect.left + 10;
        } else if (tabRect.right > containerRect.right) {
            container.scrollLeft += tabRect.right - containerRect.right + 10;
        }
    }

    // Public API
    getActiveTabId() {
        return this.activeTabId;
    }

    getAllTabs() {
        return Array.from(this.tabs.values()).map(tab => tab.data);
    }

    getTabCount() {
        return this.tabs.size;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TabUIManager;
}