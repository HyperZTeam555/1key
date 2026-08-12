import React from "react"
import type { Metadata, Viewport } from "next"
import { Bebas_Neue, Orbitron, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google"
import { DomainAnalytics } from "@/components/domain-analytics"
import "./globals.css"

export const metadata: Metadata = {
  description:
    "Your gateway to unlimited gaming. Access hundreds of unblocked games optimized for any environment.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico?v=20260301i",
    shortcut: "/favicon.ico?v=20260301i",
    apple: "/favicon.ico?v=20260301i",
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-orbitron",
  display: "swap",
})

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas-neue",
  display: "swap",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${orbitron.variable} ${bebasNeue.variable} ${plusJakartaSans.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var chunkReloadKey = '1key-chunk-reload-at';
                  var isChunkFailure = function(message, requestUrl) {
                    var msg = String(message || '').toLowerCase();
                    var req = String(requestUrl || '').toLowerCase();
                    return (
                      msg.indexOf('chunkloaderror') !== -1 ||
                      (msg.indexOf('loading chunk') !== -1 && msg.indexOf('failed') !== -1) ||
                      msg.indexOf("cannot read properties of undefined (reading 'call')") !== -1 ||
                      msg.indexOf('reading \\'call\\'') !== -1 ||
                      (req.indexOf('/_next/static/chunks/') !== -1 && req.indexOf('.js') !== -1)
                    );
                  };
                  var recoverChunkLoad = function() {
                    var now = Date.now();
                    var last = Number(sessionStorage.getItem(chunkReloadKey) || 0);
                    if (now - last < 12000) return;
                    sessionStorage.setItem(chunkReloadKey, String(now));
                    window.location.reload();
                  };

                  window.addEventListener('error', function(event) {
                    var target = event && event.target;
                    var src = target && typeof target.src === 'string' ? target.src : '';
                    var err = event && event.error;
                    var msg = (err && err.message) || (event && event.message) || '';
                    if (isChunkFailure(msg, src)) recoverChunkLoad();
                  }, true);

                  window.addEventListener('unhandledrejection', function(event) {
                    var reason = event && event.reason;
                    var msg = typeof reason === 'string'
                      ? reason
                      : reason && reason.message
                        ? reason.message
                        : '';
                    var request = reason && reason.request ? reason.request : '';
                    if (isChunkFailure(msg, request)) recoverChunkLoad();
                  });

                  window.setTimeout(function() {
                    sessionStorage.removeItem(chunkReloadKey);
                  }, 20000);

                  var swResetVersion = '20260304a';
                  var swResetKey = '1key-sw-reset-version';
                  var swResetSessionKey = '1key-sw-reset-session';
                  var swResetMemoryKey = '__onekeySwResetVersion';
                  var runStaleWorkerCleanup = function() {
                    if (!('serviceWorker' in navigator)) return;

                    if (window[swResetMemoryKey] === swResetVersion) return;

                    var already = '';
                    try { already = localStorage.getItem(swResetKey) || ''; } catch (_err) {}
                    if (already === swResetVersion) return;

                    var alreadySession = '';
                    try { alreadySession = sessionStorage.getItem(swResetSessionKey) || ''; } catch (_err) {}
                    if (alreadySession === swResetVersion) return;

                    window[swResetMemoryKey] = swResetVersion;

                    var sessionGuardStored = false;
                    try {
                      sessionStorage.setItem(swResetSessionKey, swResetVersion);
                      sessionGuardStored = sessionStorage.getItem(swResetSessionKey) === swResetVersion;
                    } catch (_err) {}

                    var unregisteredCount = 0;

                    var clearBareMuxState = function() {
                      try { localStorage.removeItem('bare-mux-path'); } catch (_err) {}
                      try { localStorage.removeItem('baremux-path'); } catch (_err) {}
                      try { sessionStorage.removeItem('bare-mux-path'); } catch (_err) {}
                      try { sessionStorage.removeItem('baremux-path'); } catch (_err) {}
                    };

                    var markDone = function() {
                      try {
                        localStorage.setItem(swResetKey, swResetVersion);
                        return localStorage.getItem(swResetKey) === swResetVersion;
                      } catch (_err) {}
                      return false;
                    };

                    var dropCaches = function() {
                      if (!('caches' in window)) return Promise.resolve();
                      return caches.keys().then(function(keys) {
                        return Promise.all(
                          keys.map(function(key) {
                            var name = String(key || '').toLowerCase();
                            var shouldDrop =
                              name.indexOf('scram') !== -1 ||
                              name.indexOf('bare') !== -1 ||
                              name.indexOf('1key') !== -1 ||
                              name.indexOf('workbox') !== -1;
                            if (!shouldDrop) return Promise.resolve();
                            return caches.delete(key).catch(function() {});
                          })
                        );
                      });
                    };

                    navigator.serviceWorker
                      .getRegistrations()
                      .then(function(registrations) {
                        return Promise.all(
                          registrations.map(function(registration) {
                            var scope = String(registration && registration.scope ? registration.scope : '').toLowerCase();
                            var shouldUnregister =
                              scope.indexOf('/scramjet') !== -1 ||
                              scope.indexOf('/baremux') !== -1 ||
                              scope.indexOf('1key.lol') !== -1;
                            if (!shouldUnregister) return Promise.resolve();
                            return registration
                              .unregister()
                              .then(function(removed) {
                                if (removed !== false) unregisteredCount += 1;
                              })
                              .catch(function() {});
                          })
                        );
                      })
                      .then(dropCaches)
                      .then(function() { clearBareMuxState(); })
                      .then(function() {
                        var guardStored = markDone() || sessionGuardStored;
                        if (
                          unregisteredCount > 0 &&
                          guardStored &&
                          window.location.pathname.indexOf('/proxy') === 0
                        ) {
                          window.location.reload();
                        }
                      })
                      .catch(function() {
                        markDone();
                      });
                  };

                  if (document.readyState === 'complete') {
                    runStaleWorkerCleanup();
                  } else {
                    window.addEventListener('load', function() {
                      runStaleWorkerCleanup();
                    }, { once: true });
                  }

                  var saved = localStorage.getItem('1key-settings');
                  var setIcons = function(href) {
                    ['icon', 'shortcut icon', 'apple-touch-icon'].forEach(function(rel) {
                      var link = document.querySelector('link[rel="' + rel + '"]');
                      if (!link) {
                        link = document.createElement('link');
                        link.rel = rel;
                        document.head.appendChild(link);
                      }
                      link.href = href;
                    });
                  };

                  if (!saved) {
                    document.title = '1key';
                    setIcons('/favicon.ico?v=20260301i');
                    return;
                  }

                  var settings = JSON.parse(saved) || {};
                  var root = document.documentElement;

                  document.title = settings.tabTitle || '1key';
                  var rawTabIcon = typeof settings.tabIcon === 'string' ? settings.tabIcon.trim() : '';
                  var blockedIcon = rawTabIcon && /(scramjet|1key\\.lol\\/scramjet|duckduckgo\\.com\\/favicon|google\\.com\\/favicon|bing\\.com\\/favicon)/i.test(rawTabIcon);
                  var effectiveIcon = !blockedIcon && rawTabIcon ? rawTabIcon : '/favicon.ico?v=20260301i';
                  setIcons(effectiveIcon);

                  if (settings.colorTheme && settings.colorTheme !== 'midnight') {
                    root.classList.add('theme-' + settings.colorTheme);
                  }

                  var overrides = settings.themeOverrides && settings.colorTheme ? settings.themeOverrides[settings.colorTheme] : null;
                  var colors = overrides && overrides.colors ? overrides.colors : null;

                  var hexToRgb = function(hex) {
                    if (!hex) return null;
                    var normalized = String(hex).replace('#', '').trim();
                    if (normalized.length === 3) {
                      return {
                        r: parseInt(normalized[0] + normalized[0], 16),
                        g: parseInt(normalized[1] + normalized[1], 16),
                        b: parseInt(normalized[2] + normalized[2], 16),
                      };
                    }
                    if (normalized.length === 6) {
                      return {
                        r: parseInt(normalized.slice(0, 2), 16),
                        g: parseInt(normalized.slice(2, 4), 16),
                        b: parseInt(normalized.slice(4, 6), 16),
                      };
                    }
                    return null;
                  };
                  var contrastColor = function(hex) {
                    var rgb = hexToRgb(hex);
                    if (!rgb) return '#ffffff';
                    var luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
                    return luminance > 0.6 ? '#000000' : '#ffffff';
                  };
                  var rgba = function(hex, alpha) {
                    var rgb = hexToRgb(hex);
                    if (!rgb) return 'rgba(0,0,0,' + alpha + ')';
                    return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
                  };
                  var setIf = function(variable, value) {
                    if (!value) return;
                    root.style.setProperty(variable, value);
                  };

                  if (colors) {
                    setIf('--background', colors.background);
                    setIf('--foreground', colors.foreground);
                    setIf('--card', colors.card);
                    setIf('--border', colors.border);

                    if (colors.foreground) {
                      setIf('--card-foreground', colors.foreground);
                      setIf('--popover-foreground', colors.foreground);
                      setIf('--secondary-foreground', colors.foreground);
                      setIf('--muted-foreground', colors.foreground);
                      setIf('--sidebar-foreground', colors.foreground);
                      setIf('--sidebar-accent-foreground', colors.foreground);
                    }
                    if (colors.card) {
                      setIf('--popover', colors.card);
                      setIf('--secondary', colors.card);
                      setIf('--muted', colors.card);
                      setIf('--input', colors.card);
                    }
                    if (colors.primary) {
                      setIf('--primary', colors.primary);
                      setIf('--primary-foreground', contrastColor(colors.primary));
                      setIf('--sidebar-primary', colors.primary);
                      setIf('--sidebar-primary-foreground', contrastColor(colors.primary));
                    }
                    if (colors.accent) {
                      setIf('--accent', colors.accent);
                      setIf('--accent-foreground', contrastColor(colors.accent));
                      setIf('--ring', colors.accent);
                      setIf('--sidebar-accent', colors.accent);
                      setIf('--sidebar-ring', colors.accent);
                    }
                    if (colors.background) {
                      setIf('--sidebar', colors.background);
                      setIf('--glass', rgba(colors.background, 0.65));
                    }
                    if (colors.border) {
                      setIf('--sidebar-border', colors.border);
                      setIf('--glass-border', rgba(colors.border, 0.4));
                    }
                  }

                  var fontId = settings.fontId || 'geist';
                  var fontMap = {
                    'geist': 'Geist, ui-sans-serif, system-ui, -apple-system, sans-serif',
                    'plus-jakarta-sans': 'var(--font-plus-jakarta-sans), ui-sans-serif, system-ui, -apple-system, sans-serif',
                    'space-grotesk': 'var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif',
                    'orbitron': 'var(--font-orbitron), ui-sans-serif, system-ui, sans-serif',
                    'bebas-neue': 'var(--font-bebas-neue), ui-sans-serif, system-ui, sans-serif'
                  };
                  var fontCss = fontMap[fontId] || fontMap['geist'];

                  var scaleMap = { sm: '14px', md: '16px', lg: '18px', xl: '20px' };
                  var spacingMap = { tight: '-0.02em', normal: '0em', wide: '0.03em', wider: '0.06em' };

                  root.style.setProperty('--font-sans', fontCss);
                  root.style.setProperty('--app-font', fontCss);
                  root.style.setProperty('--app-font-size', scaleMap[settings.fontScale] || '16px');
                  root.style.setProperty('--app-letter-spacing', spacingMap[settings.letterSpacing] || '0em');
                  root.style.setProperty('--app-font-weight', settings.boldFont ? '700' : '400');
                  root.style.setProperty('--app-gui-scale', settings.guiScale || '1');
                  if (settings.boldFont) root.classList.add('app-bold');
                } catch(e) {
                  document.title = '1key';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <DomainAnalytics />
        {children}
      </body>
    </html>
  )
}
