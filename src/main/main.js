const { app, ipcMain } = require('electron');
const WindowManager = require('./window-manager');
const { EVENTS } = require('../shared/constants');

class BrowserApp {
    constructor() {
        this.windowManager = new WindowManager();
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // App lifecycle events
        app.whenReady().then(() => {
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
    }

    createMainWindow() {
        const window = this.windowManager.createWindow({
            title: 'My Browser'
        });

        return window;
    }
}

// Create and start the application
const browserApp = new BrowserApp();
