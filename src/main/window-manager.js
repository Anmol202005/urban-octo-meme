const { BrowserWindow, shell } = require('electron');
const path = require('path');
const { WINDOW } = require('../shared/constants');
const TabManager = require('./tab-manager');

class WindowManager {
    constructor() {
        this.windows = new Map();
        this.activeWindow = null;
    }

    createWindow(options = {}) {
        const windowOptions = {
            width: options.width || WINDOW.DEFAULT_WIDTH,
            height: options.height || WINDOW.DEFAULT_HEIGHT,
            minWidth: WINDOW.MIN_WIDTH,
            minHeight: WINDOW.MIN_HEIGHT,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                enableRemoteModule: false,
                preload: path.join(__dirname, 'preload.js'),
                webSecurity: true
            },
            show: false, // Don't show until ready
            titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
            ...options
        };

        const window = new BrowserWindow(windowOptions);
        const windowId = window.id;

        // Store window reference
        this.windows.set(windowId, window);
        this.activeWindow = window;

        // Create tab manager for this window
        const tabManager = new TabManager(window);
        window.tabManager = tabManager;

        // Load the renderer
        window.loadFile(path.join(__dirname, '../renderer/index.html'));

        // Show window when ready and create initial tab
        window.once('ready-to-show', () => {
            window.show();

            // Create the first tab
            if (window.tabManager) {
                window.tabManager.createTab();
            }

            if (process.env.NODE_ENV === 'development') {
                window.webContents.openDevTools();
            }
        });

        // Handle window closed
        window.on('closed', () => {
            this.windows.delete(windowId);

            if (this.activeWindow === window) {
                this.activeWindow = this.windows.size > 0 ?
                    this.windows.values().next().value : null;
            }
        });

        // Handle window resize - update tab view bounds
        window.on('resize', () => {
            if (window.tabManager) {
                window.tabManager.onWindowResize();
            }
        });

        // Handle external links
        window.webContents.setWindowOpenHandler(({ url }) => {
            shell.openExternal(url);
            return { action: 'deny' };
        });

        return window;
    }

    getWindow(windowId) {
        return this.windows.get(windowId);
    }

    getActiveWindow() {
        return this.activeWindow;
    }

    getAllWindows() {
        return Array.from(this.windows.values());
    }

    closeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            window.close();
        }
    }

    closeAllWindows() {
        this.windows.forEach(window => window.close());
    }
}

module.exports = WindowManager;
