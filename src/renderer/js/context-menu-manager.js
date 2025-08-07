class ContextMenuManager {
    constructor() {
        this.currentSelection = '';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Only handle context menu for browser UI elements (not web content)
        document.addEventListener('contextmenu', (e) => {
            // Check if we're in the browser UI area (not web content)
            const browserUI = e.target.closest('.browser-header, .navigation-bar, .tab-bar');
            if (browserUI) {
                e.preventDefault();
                this.showUIContextMenu(e);
            }
        });

        // Hide context menu on click elsewhere
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
                this.toggleDevTools();
            }

            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.showFindDialog();
            }
        });

        // Track text selection for UI elements
        document.addEventListener('selectionchange', () => {
            this.currentSelection = window.getSelection().toString();
        });
    }

    showUIContextMenu(e) {
        // Remove existing menu
        this.hideContextMenu();

        const menu = this.createUIContextMenu(e);
        menu.style.left = e.pageX + 'px';
        menu.style.top = e.pageY + 'px';

        document.body.appendChild(menu);

        // Adjust position if menu goes off screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (e.pageX - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (e.pageY - rect.height) + 'px';
        }
    }

    createUIContextMenu(e) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'context-menu';

        const target = e.target;
        const isTab = target.closest('.tab');
        const isUrlBar = target.closest('.url-bar');

        const menuItems = [];

        // Tab-specific options
        if (isTab) {
            menuItems.push(
                { label: 'New Tab', action: () => this.newTab(), enabled: true },
                { label: 'Close Tab', action: () => this.closeCurrentTab(), enabled: true },
                { label: 'Duplicate Tab', action: () => this.duplicateTab(), enabled: true },
                { type: 'separator' }
            );
        }

        // URL bar specific options
        if (isUrlBar) {
            const hasSelection = this.currentSelection.length > 0;
            menuItems.push(
                { label: 'Cut', action: () => this.cut(), enabled: hasSelection },
                { label: 'Copy', action: () => this.copy(), enabled: hasSelection },
                { label: 'Paste', action: () => this.paste(), enabled: true },
                { type: 'separator' },
                { label: 'Select All', action: () => this.selectAll(), enabled: true },
                { type: 'separator' }
            );
        }

        // General browser options
        menuItems.push(
            { label: 'Back', action: () => this.goBack(), enabled: true },
            { label: 'Forward', action: () => this.goForward(), enabled: true },
            { label: 'Reload', action: () => this.reload(), enabled: true },
            { type: 'separator' },
            { label: 'New Tab', action: () => this.newTab(), enabled: true },
            { type: 'separator' },
            { label: 'Find in Page...', action: () => this.showFindDialog(), enabled: true },
            { label: 'Print...', action: () => this.print(), enabled: true },
            { type: 'separator' },
            { label: 'View Page Source', action: () => this.viewSource(), enabled: true },
            { label: 'Developer Tools', action: () => this.toggleDevTools(), enabled: true }
        );

        // Create menu HTML
        menuItems.forEach(item => {
            if (item.type === 'separator') {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menu.appendChild(separator);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = `context-menu-item ${item.enabled ? '' : 'disabled'}`;
                menuItem.textContent = item.label;

                if (item.enabled) {
                    menuItem.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.action();
                        this.hideContextMenu();
                    });
                }

                menu.appendChild(menuItem);
            }
        });

        return menu;
    }

    hideContextMenu() {
        const existingMenu = document.getElementById('context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
    }

    // Navigation actions
    async goBack() {
        if (window.electronAPI) {
            await window.electronAPI.tabGoBack();
        }
    }

    async goForward() {
        if (window.electronAPI) {
            await window.electronAPI.tabGoForward();
        }
    }

    async reload() {
        if (window.electronAPI) {
            await window.electronAPI.tabReload();
        }
    }

    // Tab actions
    async newTab() {
        if (window.browser) {
            window.browser.newTab();
        }
    }

    async closeCurrentTab() {
        if (window.browser) {
            window.browser.closeCurrentTab();
        }
    }

    async duplicateTab() {
        if (window.browser && window.browser.navigationManager) {
            const currentUrl = window.browser.navigationManager.getCurrentUrl();
            if (currentUrl) {
                window.browser.newTab(currentUrl);
            }
        }
    }

    // Text actions
    async copy() {
        if (this.currentSelection && window.electronAPI) {
            await window.electronAPI.copyText(this.currentSelection);
        } else {
            document.execCommand('copy');
        }
    }

    cut() {
        document.execCommand('cut');
    }

    async paste() {
        if (window.electronAPI) {
            try {
                const text = await window.electronAPI.pasteText();
                if (text) {
                    document.execCommand('insertText', false, text);
                }
            } catch (error) {
                console.error('Paste failed:', error);
                document.execCommand('paste');
            }
        } else {
            document.execCommand('paste');
        }
    }

    async selectAll() {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            activeElement.select();
        } else if (window.electronAPI) {
            await window.electronAPI.selectAll();
        } else {
            document.execCommand('selectAll');
        }
    }

    // Page actions
    showFindDialog() {
        const searchTerm = prompt('Find in page:');
        if (searchTerm && window.electronAPI) {
            window.electronAPI.findInPage(searchTerm);
        }
    }

    async print() {
        if (window.electronAPI) {
            await window.electronAPI.print();
        } else {
            window.print();
        }
    }

    async viewSource() {
        if (window.electronAPI) {
            await window.electronAPI.viewSource();
        }
    }

    async inspectElement() {
        await this.toggleDevTools();
    }

    async toggleDevTools() {
        if (window.electronAPI) {
            await window.electronAPI.toggleDevTools();
        }
    }

    // Utility methods
    getMenuPosition(e, menuWidth = 200, menuHeight = 300) {
        let x = e.pageX;
        let y = e.pageY;

        // Adjust if menu would go off screen
        if (x + menuWidth > window.innerWidth) {
            x = e.pageX - menuWidth;
        }
        if (y + menuHeight > window.innerHeight) {
            y = e.pageY - menuHeight;
        }

        // Ensure menu doesn't go off the left or top
        x = Math.max(0, x);
        y = Math.max(0, y);

        return { x, y };
    }

    // Public API
    isMenuVisible() {
        return document.getElementById('context-menu') !== null;
    }

    forceHideMenu() {
        this.hideContextMenu();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContextMenuManager;
}