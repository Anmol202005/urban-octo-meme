class PremiumHomePage {
    constructor() {
        this.settings = this.loadSettings();
        this.searchEngines = {
            google: 'https://www.google.com/search?q=',
            bing: 'https://www.bing.com/search?q=',
            duckduckgo: 'https://duckduckgo.com/?q='
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.startTimeUpdates();
        this.applyTheme();
        this.updateWeather();
        this.preloadAnimations();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('main-search');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch(searchInput.value.trim());
                }
            });

            searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });

            searchInput.addEventListener('focus', () => {
                this.showSearchSuggestions();
            });

            searchInput.addEventListener('blur', () => {
                // Delay hiding to allow clicking on suggestions
                setTimeout(() => this.hideSearchSuggestions(), 150);
            });
        }

        // Quick access links
        document.querySelectorAll('.access-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const url = item.dataset.url;
                if (url) {
                    this.navigateToUrl(url);
                }
            });

            // Add keyboard navigation
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const url = item.dataset.url;
                    if (url) {
                        this.navigateToUrl(url);
                    }
                }
            });
        });

        // Settings panel
        const settingsBtn = document.getElementById('settings-btn');
        const settingsPanel = document.getElementById('settings-panel');
        const panelClose = document.getElementById('panel-close');
        const panelBackdrop = document.getElementById('panel-backdrop');

        if (settingsBtn && settingsPanel) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }

        if (panelClose) {
            panelClose.addEventListener('click', () => {
                this.closeSettings();
            });
        }

        if (panelBackdrop) {
            panelBackdrop.addEventListener('click', () => {
                this.closeSettings();
            });
        }

        // Theme selector
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                this.setTheme(theme);
            });
        });

        // Search engine selector
        const searchEngineSelect = document.getElementById('search-engine');
        if (searchEngineSelect) {
            searchEngineSelect.value = this.settings.searchEngine || 'google';
            searchEngineSelect.addEventListener('change', (e) => {
                this.settings.searchEngine = e.target.value;
                this.saveSettings();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Focus search on '/' or Ctrl+L
            if (e.key === '/' || (e.ctrlKey && e.key === 'l')) {
                e.preventDefault();
                searchInput?.focus();
            }

            // Close settings on Escape
            if (e.key === 'Escape') {
                this.closeSettings();
            }
        });

        // Auto-focus search on page load
        setTimeout(() => {
            searchInput?.focus();
        }, 600);
    }

    updateTime() {
        const now = new Date();
        const timeElement = document.getElementById('current-time');
        const dateElement = document.getElementById('current-date');

        if (timeElement) {
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const displayHours = hours % 12 || 12;
            const period = hours >= 12 ? 'PM' : 'AM';

            timeElement.textContent = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        }

        if (dateElement) {
            const options = {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
            };
            dateElement.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    startTimeUpdates() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }

    handleSearch(query) {
        if (!query) return;

        let url;

        // Check if it's a URL
        if (this.isUrl(query)) {
            url = this.normalizeUrl(query);
        } else {
            // Use selected search engine
            const engine = this.settings.searchEngine || 'google';
            url = this.searchEngines[engine] + encodeURIComponent(query);
        }

        this.navigateToUrl(url);
    }

    handleSearchInput(value) {
        // Simple search suggestions simulation
        if (value.length > 2) {
            this.showSearchSuggestions(value);
        } else {
            this.hideSearchSuggestions();
        }
    }

    showSearchSuggestions(query = '') {
        const suggestionsEl = document.getElementById('search-suggestions');
        if (!suggestionsEl) return;

        if (query) {
            // Mock suggestions based on query
            const suggestions = this.generateSuggestions(query);

            suggestionsEl.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item" data-query="${suggestion}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <span>${suggestion}</span>
        </div>
      `).join('');

            // Add click handlers to suggestions
            suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const query = item.dataset.query;
                    document.getElementById('main-search').value = query;
                    this.handleSearch(query);
                });
            });
        }

        suggestionsEl.classList.add('show');
    }

    hideSearchSuggestions() {
        const suggestionsEl = document.getElementById('search-suggestions');
        if (suggestionsEl) {
            suggestionsEl.classList.remove('show');
        }
    }

    generateSuggestions(query) {
        const popularSites = [
            'github.com',
            'stackoverflow.com',
            'youtube.com',
            'twitter.com',
            'reddit.com',
            'netflix.com'
        ];

        const searchSuggestions = [
            `${query} tutorial`,
            `${query} examples`,
            `${query} documentation`,
            `how to ${query}`,
            `${query} vs`
        ];

        // Filter sites that match query
        const matchingSites = popularSites.filter(site =>
            site.toLowerCase().includes(query.toLowerCase())
        );

        // Combine and limit results
        return [...matchingSites, ...searchSuggestions].slice(0, 5);
    }

    isUrl(string) {
        try {
            const url = new URL(string.includes('://') ? string : 'https://' + string);
            return url.hostname.includes('.');
        } catch {
            return false;
        }
    }

    normalizeUrl(url) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return 'https://' + url;
        }
        return url;
    }

    navigateToUrl(url) {
        console.log('Navigating to:', url);

        if (window.electronAPI) {
            window.electronAPI.navigateUrl(url);
        } else {
            // Fallback for development
            window.open(url, '_blank');
        }
    }

    openSettings() {
        const panel = document.getElementById('settings-panel');
        if (panel) {
            panel.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    closeSettings() {
        const panel = document.getElementById('settings-panel');
        if (panel) {
            panel.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    setTheme(theme) {
        // Update active button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`)?.classList.add('active');

        // Save and apply theme
        this.settings.theme = theme;
        this.applyTheme();
        this.saveSettings();
    }

    applyTheme() {
        const theme = this.settings.theme || 'dark';
        const body = document.body;

        body.classList.remove('light-theme', 'dark-theme');

        if (theme === 'light') {
            body.classList.add('light-theme');
        } else if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (!prefersDark) {
                body.classList.add('light-theme');
            }
        }
        // Default is dark theme (no class needed)

        // Update theme selector
        const activeBtn = document.querySelector(`[data-theme="${theme}"]`);
        if (activeBtn) {
            document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
            activeBtn.classList.add('active');
        }
    }

    updateWeather() {
        // Simulate weather data
        const weatherInfo = document.getElementById('weather-info');
        if (weatherInfo) {
            const temp = Math.floor(Math.random() * 20) + 15; // 15-35°C
            const conditions = ['Sunny', 'Cloudy', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 4)];
            weatherInfo.textContent = `${temp}°C · ${conditions}`;
        }
    }

    preloadAnimations() {
        // Trigger animations after a short delay for smooth loading
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('premium-home-settings');
            return saved ? JSON.parse(saved) : { theme: 'dark', searchEngine: 'google' };
        } catch (error) {
            console.error('Error loading settings:', error);
            return { theme: 'dark', searchEngine: 'google' };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('premium-home-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }
}

// Add suggestion item styles
const suggestionStyles = `
  .suggestion-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    color: var(--text-secondary);
    font-size: 0.875rem;
  }
  
  .suggestion-item:hover {
    background: var(--surface-hover);
    color: var(--text-primary);
  }
  
  .suggestion-item:first-child {
    border-radius: 12px 12px 0 0;
  }
  
  .suggestion-item:last-child {
    border-radius: 0 0 12px 12px;
  }
  
  .suggestion-item svg {
    flex-shrink: 0;
    opacity: 0.6;
  }
`;

// Inject suggestion styles
const styleSheet = document.createElement('style');
styleSheet.textContent = suggestionStyles;
document.head.appendChild(styleSheet);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PremiumHomePage());
} else {
    new PremiumHomePage();
}