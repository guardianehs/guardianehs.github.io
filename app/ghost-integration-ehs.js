/**
 * Guardian Ghost Integration for Guardian EHS
 * Real-time threat monitoring and security dashboard
 * 
 * Installation:
 * 1. Copy this file to: guardian-ehs/app/ghost-integration-ehs.js
 * 2. Add to your HTML <head>:
 *    <script type="module">
 *      import { GhostEHS } from './ghost-integration-ehs.js';
 *      document.addEventListener('DOMContentLoaded', () => {
 *        GhostEHS.init(window.GhostConfig);
 *      });
 *    </script>
 */

export const GhostEHS = {
  config: {
    appName: 'Guardian EHS',
    appUrl: 'https://guardianehs.github.io/app/',
    supabaseUrl: '',
    supabaseKey: '',
    realtimeEndpoint: '',
    adminPanelUrl: 'https://guardianehs.github.io/guardian-ghost-admin-panel.html',
  },

  initialized: false,
  eventCache: [],

  /**
   * Initialize Ghost for Guardian EHS
   */
  async init(userConfig = {}) {
    if (this.initialized) return;
    
    Object.assign(this.config, userConfig);
    this.initialized = true;

    // Get user role from localStorage or auth
    const userRole = localStorage.getItem('user_role');
    
    // Master users get admin dashboard
    if (userRole === 'master') {
      this.initAdminInterface();
    }

    // All users get real-time monitoring
    this.startRealtimeMonitoring();

    // Setup warning system
    this.setupWarningSystem();

    console.log('[Ghost EHS] Initialized for Guardian EHS');
  },

  /**
   * Initialize admin interface for master users
   */
  initAdminInterface() {
    // Wait for app to be ready
    setTimeout(() => {
      this.injectAdminMenu();
    }, 500);
  },

  /**
   * Inject Ghost Security button into admin menu
   */
  injectAdminMenu() {
    // Try different selectors for admin nav
    const adminNav = 
      document.querySelector('[data-section="admin"]') ||
      document.querySelector('.admin-nav') ||
      document.querySelector('[role="navigation"]');

    if (!adminNav) {
      // If no nav found, create floating button
      this.createFloatingButton();
      return;
    }

    // Create Ghost menu item
    const ghostItem = document.createElement('div');
    ghostItem.className = 'ghost-ehs-nav-item';
    ghostItem.innerHTML = `
      <button class="ghost-ehs-nav-btn" title="Open Guardian Ghost Admin Panel">
        <span class="ghost-ehs-icon">🛡️</span>
        <span class="ghost-ehs-label">Ghost Security</span>
      </button>
    `;

    ghostItem.querySelector('.ghost-ehs-nav-btn').addEventListener('click', () => {
      this.openAdminPanel();
    });

    adminNav.appendChild(ghostItem);
  },

  /**
   * Create floating button if no admin nav found
   */
  createFloatingButton() {
    const button = document.createElement('button');
    button.className = 'ghost-ehs-floating-btn';
    button.title = 'Open Guardian Ghost Admin Panel';
    button.innerHTML = '🛡️';
    button.addEventListener('click', () => this.openAdminPanel());
    document.body.appendChild(button);
  },

  /**
   * Open the admin panel in new window or tab
   */
  openAdminPanel() {
    const jwt = localStorage.getItem('supabase_jwt');
    const panelUrl = new URL(this.config.adminPanelUrl);
    
    // Pass JWT as param for authentication
    if (jwt) {
      panelUrl.searchParams.set('jwt', jwt);
    }
    
    // Open in new tab
    window.open(panelUrl.toString(), 'GhostAdminPanel', 'width=1400,height=900');
  },

  /**
   * Start real-time monitoring for all users
   */
  startRealtimeMonitoring() {
    // Connect to real-time event stream
    this.connectEventStream();

    // Setup threat notifications
    this.setupThreatNotifications();

    // Poll for threats periodically
    setInterval(() => {
      this.checkForThreats();
    }, 30000);
  },

  /**
   * Connect to SSE event stream
   */
  connectEventStream() {
    if (!this.config.realtimeEndpoint) {
      console.warn('[Ghost EHS] No realtime endpoint configured');
      return;
    }

    const jwt = localStorage.getItem('supabase_jwt');
    if (!jwt) return;

    try {
      const eventSource = new EventSource(this.config.realtimeEndpoint, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        }
      });

      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleRealtimeEvent(data);
        } catch (error) {
          console.error('[Ghost EHS] Error parsing event:', error);
        }
      });

      eventSource.addEventListener('error', () => {
        console.log('[Ghost EHS] SSE connection lost, retrying...');
        eventSource.close();
        setTimeout(() => this.connectEventStream(), 5000);
      });

      this.eventSource = eventSource;
    } catch (error) {
      console.error('[Ghost EHS] Error connecting to event stream:', error);
    }
  },

  /**
   * Handle real-time event from stream
   */
  handleRealtimeEvent(data) {
    // Store recent events
    if (data.events) {
      this.eventCache = data.events.slice(0, 100);
    }

    // Show notification if critical threat
    if (data.summary?.events_24h_critical > 0) {
      this.showNotification(
        `🚨 CRITICAL: ${data.summary.events_24h_critical} threat(s) detected on Guardian EHS`,
        'critical'
      );
    } else if (data.summary?.events_24h_high > 0) {
      this.showNotification(
        `⚠️ HIGH: ${data.summary.events_24h_high} high-severity event(s) detected`,
        'high'
      );
    }
  },

  /**
   * Check for new threats
   */
  async checkForThreats() {
    try {
      const response = await fetch(this.config.realtimeEndpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_jwt')}`,
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      this.handleRealtimeEvent(data);
    } catch (error) {
      // Silently fail - don't spam console
    }
  },

  /**
   * Setup threat notification system
   */
  setupThreatNotifications() {
    this.injectStyles();
  },

  /**
   * Show notification to user
   */
  showNotification(message, severity = 'info') {
    const notification = document.createElement('div');
    notification.className = `ghost-ehs-notification ghost-ehs-notification-${severity}`;
    notification.innerHTML = `
      <div class="ghost-ehs-notif-content">
        ${message}
      </div>
      <button class="ghost-ehs-notif-close">×</button>
    `;

    document.body.appendChild(notification);

    notification.querySelector('.ghost-ehs-notif-close').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      notification.remove();
    }, 10000);
  },

  /**
   * Setup warning system for middleware integration
   */
  setupWarningSystem() {
    // Make Ghost accessible to window for middleware
    window.GuardianGhost = {
      getCustomWarning: (pattern) => this.getCustomWarning(pattern),
      logWarningShown: (pattern) => this.logWarningShown(pattern),
      appName: 'Guardian EHS',
    };
  },

  /**
   * Get custom warning message for a pattern
   */
  async getCustomWarning(pattern) {
    try {
      const jwt = localStorage.getItem('supabase_jwt');
      const response = await fetch(
        `${this.config.supabaseUrl}/rest/v1/rpc/ghost_get_warnings`,
        {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) return null;

      const warnings = await response.json();
      
      // Find matching warning
      const matching = warnings.find(w => {
        try {
          return new RegExp(w.trigger_pattern).test(pattern);
        } catch {
          return false;
        }
      });

      return matching;
    } catch (error) {
      console.error('[Ghost EHS] Error fetching warning:', error);
      return null;
    }
  },

  /**
   * Log warning shown event
   */
  async logWarningShown(pattern) {
    try {
      const jwt = localStorage.getItem('supabase_jwt');
      await fetch(
        `${this.config.supabaseUrl}/rest/v1/ghost_events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ip: 'local',
            rule: pattern,
            severity: 'info',
            action: 'warning_shown',
            app_name: 'Guardian EHS',
          })
        }
      );
    } catch (error) {
      // Silently fail
    }
  },

  /**
   * Inject CSS styles for Ghost UI elements
   */
  injectStyles() {
    if (document.getElementById('ghost-ehs-styles')) return;

    const style = document.createElement('style');
    style.id = 'ghost-ehs-styles';
    style.textContent = `
      /* Ghost Security Nav Item */
      .ghost-ehs-nav-item {
        padding: 0.5rem 0;
      }

      .ghost-ehs-nav-btn {
        width: 100%;
        padding: 0.75rem 1rem;
        background: rgba(0, 255, 0, 0.05);
        border: 1px solid #0f0;
        color: #0f0;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;
        font-family: monospace;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-align: left;
      }

      .ghost-ehs-nav-btn:hover {
        background: rgba(0, 255, 0, 0.2);
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        transform: scale(1.02);
      }

      .ghost-ehs-icon {
        font-size: 1.2rem;
      }

      .ghost-ehs-label {
        font-weight: bold;
        text-shadow: 0 0 5px #0f0;
      }

      /* Floating Button (if no nav) */
      .ghost-ehs-floating-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #0a0e27;
        border: 2px solid #0f0;
        color: #0f0;
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 0 15px rgba(0, 255, 0, 0.3);
        z-index: 9998;
      }

      .ghost-ehs-floating-btn:hover {
        box-shadow: 0 0 25px rgba(0, 255, 0, 0.6);
        transform: scale(1.1);
      }

      .ghost-ehs-floating-btn:active {
        transform: scale(0.95);
      }

      /* Notifications */
      .ghost-ehs-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        padding: 1rem;
        border-radius: 6px;
        background: #0d1117;
        border: 2px solid #0f0;
        color: #0f0;
        z-index: 10000;
        animation: ghostSlideIn 0.3s ease-out;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        font-family: monospace;
      }

      .ghost-ehs-notification-critical {
        border-color: #f00;
        color: #f00;
      }

      .ghost-ehs-notification-high {
        border-color: #ff8800;
        color: #ff8800;
      }

      .ghost-ehs-notif-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .ghost-ehs-notif-close:hover {
        opacity: 0.7;
      }

      @keyframes ghostSlideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @media (max-width: 768px) {
        .ghost-ehs-floating-btn {
          bottom: 10px;
          right: 10px;
          width: 45px;
          height: 45px;
          font-size: 1.2rem;
        }

        .ghost-ehs-notification {
          left: 10px;
          right: 10px;
          max-width: none;
        }
      }
    `;

    document.head.appendChild(style);
  },

  /**
   * Log event to Ghost
   */
  async logEvent(eventData) {
    try {
      const jwt = localStorage.getItem('supabase_jwt');
      await fetch(
        `${this.config.supabaseUrl}/rest/v1/ghost_events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...eventData,
            app_name: 'Guardian EHS',
            ts: new Date().toISOString(),
          })
        }
      );
    } catch (error) {
      console.error('[Ghost EHS] Error logging event:', error);
    }
  },

  /**
   * Get cached events
   */
  getEvents() {
    return this.eventCache;
  },

  /**
   * Disconnect
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  },
};

// Auto-initialize if config exists
if (window.GhostConfig && !window.GhostEHSInitialized) {
  window.GhostEHSInitialized = true;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      GhostEHS.init(window.GhostConfig);
    });
  } else {
    GhostEHS.init(window.GhostConfig);
  }
}
