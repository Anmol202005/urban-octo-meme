const { BrowserView, ipcMain, Menu } = require('electron');
const { EVENTS, BROWSER } = require('../shared/constants');

class TabManager {
    constructor(window) {
        this.window = window;
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;

        this.setupIpcHandlers();
    }

    setupIpcHandlers() {
        // Handle navigation requests from renderer
        ipcMain.handle('create-tab', (event, url = BROWSER.DEFAULT_HOME_URL) => {
            return this.createTab(url);
        });

        ipcMain.handle('close-tab', (event, tabId) => {
            return this.closeTab(tabId);
        });

        ipcMain.handle('switch-tab', (event, tabId) => {
            return this.switchToTab(tabId);
        });

        ipcMain.handle('navigate-tab', (event, tabId, url) => {
            return this.navigateTab(tabId, url);
        });

        ipcMain.handle('get-tabs', () => {
            return this.getAllTabsInfo();
        });

        ipcMain.handle('get-active-tab', () => {
            return this.getActiveTabInfo();
        });
    }

    createTab(url = BROWSER.DEFAULT_HOME_URL) {
        const tabId = `tab-${++this.tabCounter}`;

        // Create new BrowserView
        const view = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                sandbox: true,
                webSecurity: true
            }
        });

        // Store tab info
        const tabInfo = {
            id: tabId,
            view: view,
            url: url,
            title: 'New Tab',
            loading: false,
            canGoBack: false,
            canGoForward: false,
            favicon: null
        };

        this.tabs.set(tabId, tabInfo);

        // Setup view event handlers
        this.setupViewEventHandlers(tabId, view);

        // Always set new tab as active
        this.switchToTab(tabId);

        // Navigate to URL
        if (url === BROWSER.DEFAULT_HOME_URL || url === 'browser://newtab') {
            // Load the home page HTML file
            const path = require('path');
            const homePagePath = path.join(__dirname, '../renderer/home.html');
            view.webContents.loadFile(homePagePath);

            // Update tab info for home page
            tabInfo.url = 'browser://newtab';
            tabInfo.title = 'New Tab';
        } else {
            this.navigateTab(tabId, url);
        }

        // Notify renderer about new tab
        this.notifyRenderer('tab-created', { tabId, ...tabInfo });

        return tabId;
    }

    closeTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return false;

        // Remove the view from window
        if (this.activeTabId === tabId) {
            this.window.removeBrowserView(tab.view);
        }

        // Destroy the view
        tab.view.webContents.destroy();

        // Remove from tabs map
        this.tabs.delete(tabId);

        // If this was the active tab, switch to another
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.switchToTab(remainingTabs[0]);
            } else {
                this.activeTabId = null;
                // Close the window when no tabs remain
                this.window.close();
            }
        }

        // Notify renderer
        this.notifyRenderer('tab-closed', { tabId });

        return true;
    }

    switchToTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return false;

        // Remove current active view
        if (this.activeTabId) {
            const currentTab = this.tabs.get(this.activeTabId);
            if (currentTab) {
                this.window.removeBrowserView(currentTab.view);
            }
        }

        // Add new active view
        this.window.addBrowserView(tab.view);
        this.updateViewBounds(tab.view);

        this.activeTabId = tabId;

        // Notify renderer about tab switch
        this.notifyRenderer('tab-activated', { tabId, ...tab });

        return true;
    }

    navigateTab(tabId, url) {
        const tab = this.tabs.get(tabId);
        if (!tab) return false;

        // Process URL (add protocol if needed)
        url = this.processUrl(url);

        // Handle special URLs
        if (url === 'browser://newtab' || url === 'about:newtab') {
            // Load home page
            const path = require('path');
            const homePagePath = path.join(__dirname, '../renderer/home.html');
            tab.view.webContents.loadFile(homePagePath);

            // Update tab info
            tab.url = 'browser://newtab';
            tab.title = 'New Tab';
            tab.loading = false;

            this.notifyRenderer('tab-url-updated', { tabId, url: 'browser://newtab' });
            this.notifyRenderer('tab-title-updated', { tabId, title: 'New Tab' });
            return true;
        }

        // Update tab info
        tab.url = url;
        tab.loading = true;

        // Navigate
        tab.view.webContents.loadURL(url);

        // Notify renderer
        this.notifyRenderer('tab-navigation-started', { tabId, url });

        return true;
    }

    setupViewEventHandlers(tabId, view) {
        const webContents = view.webContents;

        // Context menu for web content
        webContents.on('context-menu', (event, params) => {
            this.showContextMenu(tabId, params);
        });

        // Navigation events
        webContents.on('did-start-loading', () => {
            this.updateTabInfo(tabId, { loading: true });
            this.notifyRenderer('tab-loading-started', { tabId });
        });

        webContents.on('did-stop-loading', () => {
            this.updateTabInfo(tabId, { loading: false });
            this.notifyRenderer('tab-loading-stopped', { tabId });
        });

        webContents.on('did-finish-load', () => {
            const tab = this.tabs.get(tabId);
            if (tab) {
                tab.canGoBack = webContents.canGoBack();
                tab.canGoForward = webContents.canGoForward();
                this.notifyRenderer('tab-loaded', {
                    tabId,
                    canGoBack: tab.canGoBack,
                    canGoForward: tab.canGoForward
                });
            }
        });

        webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
            this.notifyRenderer('tab-load-failed', {
                tabId,
                errorCode,
                errorDescription,
                url: validatedURL
            });
        });

        // Title and URL updates
        webContents.on('page-title-updated', (event, title) => {
            this.updateTabInfo(tabId, { title });
            this.notifyRenderer('tab-title-updated', { tabId, title });
        });

        webContents.on('did-navigate', (event, url) => {
            this.updateTabInfo(tabId, { url });
            this.notifyRenderer('tab-url-updated', { tabId, url });
        });

        webContents.on('did-navigate-in-page', (event, url) => {
            this.updateTabInfo(tabId, { url });
            this.notifyRenderer('tab-url-updated', { tabId, url });
        });

        // New window handling
        webContents.setWindowOpenHandler(({ url }) => {
            // Create new tab for new windows
            this.createTab(url);
            return { action: 'deny' };
        });
    }

    updateTabInfo(tabId, updates) {
        const tab = this.tabs.get(tabId);
        if (tab) {
            Object.assign(tab, updates);
        }
    }

    updateViewBounds(view) {
        const bounds = this.window.getBounds();

        view.setBounds({
            x: 0,
            y: BROWSER.HEADER_HEIGHT,
            width: bounds.width,
            height: bounds.height - BROWSER.HEADER_HEIGHT
        });
    }

    // Handle window resize
    onWindowResize() {
        if (this.activeTabId) {
            const activeTab = this.tabs.get(this.activeTabId);
            if (activeTab) {
                this.updateViewBounds(activeTab.view);
            }
        }
    }

    processUrl(input) {
        if (!input) return BROWSER.DEFAULT_HOME_URL;

        input = input.trim();

        // Handle special browser URLs
        if (input === 'newtab' || input === 'home') {
            return 'browser://newtab';
        }

        // If it looks like a search query
        if (!input.includes('.') && !input.includes('://')) {
            return BROWSER.DEFAULT_SEARCH_ENGINE + encodeURIComponent(input);
        }

        // Add protocol if missing
        if (!input.startsWith('http://') && !input.startsWith('https://') && !input.startsWith('browser://')) {
            return 'https://' + input;
        }

        return input;
    }

    getAllTabsInfo() {
        return Array.from(this.tabs.values()).map(tab => ({
            id: tab.id,
            title: tab.title,
            url: tab.url,
            loading: tab.loading,
            canGoBack: tab.canGoBack,
            canGoForward: tab.canGoForward
        }));
    }

    getActiveTabInfo() {
        if (!this.activeTabId) return null;

        const tab = this.tabs.get(this.activeTabId);
        if (!tab) return null;

        return {
            id: tab.id,
            title: tab.title,
            url: tab.url,
            loading: tab.loading,
            canGoBack: tab.canGoBack,
            canGoForward: tab.canGoForward
        };
    }

    notifyRenderer(event, data) {
        this.window.webContents.send(event, data);
    }

    // Navigation methods for active tab
    goBack() {
        if (this.activeTabId) {
            const tab = this.tabs.get(this.activeTabId);
            if (tab && tab.view.webContents.canGoBack()) {
                tab.view.webContents.goBack();
            }
        }
    }

    goForward() {
        if (this.activeTabId) {
            const tab = this.tabs.get(this.activeTabId);
            if (tab && tab.view.webContents.canGoForward()) {
                tab.view.webContents.goForward();
            }
        }
    }

    reload() {
        if (this.activeTabId) {
            const tab = this.tabs.get(this.activeTabId);
            if (tab) {
                tab.view.webContents.reload();
            }
        }
    }

    stop() {
        if (this.activeTabId) {
            const tab = this.tabs.get(this.activeTabId);
            if (tab) {
                tab.view.webContents.stop();
            }
        }
    }

    showContextMenu(tabId, params) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        const template = [];

        // Navigation items
        template.push(
            {
                label: 'Back',
                enabled: tab.view.webContents.canGoBack(),
                click: () => tab.view.webContents.goBack()
            },
            {
                label: 'Forward',
                enabled: tab.view.webContents.canGoForward(),
                click: () => tab.view.webContents.goForward()
            },
            {
                label: 'Reload',
                click: () => tab.view.webContents.reload()
            },
            { type: 'separator' }
        );

        // Text selection items
        if (params.selectionText) {
            template.push(
                {
                    label: 'Copy',
                    click: () => tab.view.webContents.copy()
                },
                { type: 'separator' }
            );
        }

        // Input field items
        if (params.isEditable) {
            template.push(
                {
                    label: 'Cut',
                    enabled: params.selectionText,
                    click: () => tab.view.webContents.cut()
                },
                {
                    label: 'Copy',
                    enabled: params.selectionText,
                    click: () => tab.view.webContents.copy()
                },
                {
                    label: 'Paste',
                    click: () => tab.view.webContents.paste()
                },
                { type: 'separator' },
                {
                    label: 'Select All',
                    click: () => tab.view.webContents.selectAll()
                },
                { type: 'separator' }
            );
        }

        // Link items
        if (params.linkURL) {
            template.push(
                {
                    label: 'Open Link in New Tab',
                    click: () => this.createTab(params.linkURL)
                },
                {
                    label: 'Copy Link Address',
                    click: () => {
                        const { clipboard } = require('electron');
                        clipboard.writeText(params.linkURL);
                    }
                },
                { type: 'separator' }
            );
        }

        // Image items
        if (params.hasImageContents) {
            template.push(
                {
                    label: 'Open Image in New Tab',
                    click: () => this.createTab(params.srcURL)
                },
                {
                    label: 'Copy Image Address',
                    click: () => {
                        const { clipboard } = require('electron');
                        clipboard.writeText(params.srcURL);
                    }
                },
                { type: 'separator' }
            );
        }

        // Page items
        template.push(
            {
                label: 'View Page Source',
                click: () => {
                    const url = tab.view.webContents.getURL();
                    if (url && !url.startsWith('view-source:')) {
                        this.createTab('view-source:' + url);
                    }
                }
            },
            {
                label: 'Inspect Element',
                click: () => {
                    tab.view.webContents.inspectElement(params.x, params.y);
                }
            }
        );

        const menu = Menu.buildFromTemplate(template);
        menu.popup({
            window: this.window,
            x: params.x,
            y: params.y
        });
    }
}

module.exports = TabManager;