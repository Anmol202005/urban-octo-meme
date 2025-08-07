const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getPlatform: () => ipcRenderer.invoke('get-platform'),

    // Tab management
    createTab: (url) => ipcRenderer.invoke('create-tab', url),
    closeTab: (tabId) => ipcRenderer.invoke('close-tab', tabId),
    switchTab: (tabId) => ipcRenderer.invoke('switch-tab', tabId),
    getTabs: () => ipcRenderer.invoke('get-tabs'),
    getActiveTab: () => ipcRenderer.invoke('get-active-tab'),

    // Navigation
    navigateUrl: (url) => ipcRenderer.invoke('navigate-url', url),
    tabGoBack: () => ipcRenderer.invoke('tab-go-back'),
    tabGoForward: () => ipcRenderer.invoke('tab-go-forward'),
    tabReload: () => ipcRenderer.invoke('tab-reload'),
    tabStop: () => ipcRenderer.invoke('tab-stop'),

    // Event listeners for tab events
    onTabCreated: (callback) => {
        ipcRenderer.on('tab-created', (event, data) => callback(data));
    },
    onTabClosed: (callback) => {
        ipcRenderer.on('tab-closed', (event, data) => callback(data));
    },
    onTabActivated: (callback) => {
        ipcRenderer.on('tab-activated', (event, data) => callback(data));
    },
    onTabLoadingStarted: (callback) => {
        ipcRenderer.on('tab-loading-started', (event, data) => callback(data));
    },
    onTabLoadingStopped: (callback) => {
        ipcRenderer.on('tab-loading-stopped', (event, data) => callback(data));
    },
    onTabLoaded: (callback) => {
        ipcRenderer.on('tab-loaded', (event, data) => callback(data));
    },
    onTabLoadFailed: (callback) => {
        ipcRenderer.on('tab-load-failed', (event, data) => callback(data));
    },
    onTabUrlUpdated: (callback) => {
        ipcRenderer.on('tab-url-updated', (event, data) => callback(data));
    },
    onTabTitleUpdated: (callback) => {
        ipcRenderer.on('tab-title-updated', (event, data) => callback(data));
    },
    onTabNavigationStarted: (callback) => {
        ipcRenderer.on('tab-navigation-started', (event, data) => callback(data));
    },

    // Remove listeners
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});
