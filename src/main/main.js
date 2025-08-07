const { app, ipcMain, Menu, clipboard } = require('electron');
const WindowManager = require('./window-manager');
const { EVENTS } = require('../shared/constants');

class BrowserApp {
    constructor() {
        this.windowManager = new WindowManager();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Remove menu bar immediately when app is ready
        app.whenReady().then(() => {
            this.setupApplicationMenu();
            this.createMainWindow();
        });

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });

        app.on('activate', () => {
            if (this.windowManager.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });

        // IPC event handlers
        this.setupIpcHandlers();
    }

    setupIpcHandlers() {
        ipcMain.handle('get-app-version', () => {
            return app.getVersion();
        });

        ipcMain.handle('get-platform', () => {
            return process.platform;
        });

        // Tab navigation handlers
        ipcMain.handle('tab-go-back', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager) {
                activeWindow.tabManager.goBack();
            }
        });

        ipcMain.handle('tab-go-forward', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager) {
                activeWindow.tabManager.goForward();
            }
        });

        ipcMain.handle('tab-reload', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager) {
                activeWindow.tabManager.reload();
            }
        });

        ipcMain.handle('tab-stop', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager) {
                activeWindow.tabManager.stop();
            }
        });

        ipcMain.handle('navigate-url', (event, url) => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager) {
                const activeTab = activeWindow.tabManager.getActiveTabInfo();
                if (activeTab) {
                    activeWindow.tabManager.navigateTab(activeTab.id, url);
                }
            }
        });

        // Developer Tools handlers
        ipcMain.handle('open-devtools', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager && activeWindow.tabManager.activeTabId) {
                const activeTab = activeWindow.tabManager.tabs.get(activeWindow.tabManager.activeTabId);
                if (activeTab) {
                    activeTab.view.webContents.openDevTools();
                }
            }
        });

        ipcMain.handle('close-devtools', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager && activeWindow.tabManager.activeTabId) {
                const activeTab = activeWindow.tabManager.tabs.get(activeWindow.tabManager.activeTabId);
                if (activeTab) {
                    activeTab.view.webContents.closeDevTools();
                }
            }
        });

        ipcMain.handle('toggle-devtools', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager && activeWindow.tabManager.activeTabId) {
                const activeTab = activeWindow.tabManager.tabs.get(activeWindow.tabManager.activeTabId);
                if (activeTab) {
                    activeTab.view.webContents.toggleDevTools();
                }
            }
        });

        // Context menu handlers
        ipcMain.handle('copy-text', (event, text) => {
            if (text) {
                clipboard.writeText(text);
            }
        });

        ipcMain.handle('paste-text', () => {
            return clipboard.readText();
        });

        ipcMain.handle('select-all', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager && activeWindow.tabManager.activeTabId) {
                const activeTab = activeWindow.tabManager.tabs.get(activeWindow.tabManager.activeTabId);
                if (activeTab) {
                    activeTab.view.webContents.selectAll();
                }
            }
        });

        ipcMain.handle('find-in-page', (event, text) => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager && activeWindow.tabManager.activeTabId) {
                const activeTab = activeWindow.tabManager.tabs.get(activeWindow.tabManager.activeTabId);
                if (activeTab && text) {
                    activeTab.view.webContents.findInPage(text);
                }
            }
        });

        ipcMain.handle('print', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager && activeWindow.tabManager.activeTabId) {
                const activeTab = activeWindow.tabManager.tabs.get(activeWindow.tabManager.activeTabId);
                if (activeTab) {
                    activeTab.view.webContents.print();
                }
            }
        });

        ipcMain.handle('view-source', () => {
            const activeWindow = this.windowManager.getActiveWindow();
            if (activeWindow && activeWindow.tabManager && activeWindow.tabManager.activeTabId) {
                const activeTab = activeWindow.tabManager.tabs.get(activeWindow.tabManager.activeTabId);
                if (activeTab) {
                    const url = activeTab.view.webContents.getURL();
                    if (url && !url.startsWith('view-source:')) {
                        activeWindow.tabManager.createTab('view-source:' + url);
                    }
                }
            }
        });
    }

    createMainWindow() {
        const window = this.windowManager.createWindow({
            title: 'My Browser'
        });

        // Force remove menu after window creation
        window.setMenuBarVisibility(false);
        window.setAutoHideMenuBar(true);

        return window;
    }

    setupApplicationMenu() {
        // Completely remove menu bar on all platforms
        Menu.setApplicationMenu(null);
    }
}

// Create and start the application
const browserApp = new BrowserApp();