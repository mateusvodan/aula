export type PixelSettings = {
  facebookPixelId?: string | null;
  googleAnalyticsId?: string | null;
  googleTagManagerId?: string | null;
  tiktokPixelId?: string | null;
};

type FbqStub = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: FbqStub;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    ttq?: { page: () => void; track: (name: string, props?: object) => void };
  }
}

let pixelsMounted = false;

export function ensurePixels(settings: PixelSettings) {
  if (typeof window === "undefined" || pixelsMounted) return;
  pixelsMounted = true;

  if (settings.googleTagManagerId) {
    const id = settings.googleTagManagerId;
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event: "gtm.js", "gtm.start": Date.now() });
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
  }

  if (settings.googleAnalyticsId && !settings.googleTagManagerId) {
    const id = settings.googleAnalyticsId;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer = window.dataLayer ?? [];
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", id);
  }

  if (settings.facebookPixelId) {
    const id = settings.facebookPixelId;
    if (!window.fbq) {
      const fbqFn = function (...args: unknown[]) {
        const self = fbqFn as FbqStub;
        if (self.callMethod) self.callMethod(...args);
        else self.queue.push(args);
      } as FbqStub;
      fbqFn.queue = [];
      fbqFn.push = fbqFn;
      fbqFn.loaded = true;
      fbqFn.version = "2.0";
      window._fbq = fbqFn;
      window.fbq = fbqFn;
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(s);
    }
    window.fbq?.("init", id);
    window.fbq?.("track", "PageView");
  }

  if (settings.tiktokPixelId) {
    const id = settings.tiktokPixelId;
    const s = document.createElement("script");
    s.async = true;
    s.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load("${id}");ttq.page();}(window,document,'ttq');`;
    document.head.appendChild(s);
  }
}

export function trackConversionEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: name,
    ...params,
  });
  window.gtag?.("event", name, params ?? {});
  window.fbq?.("trackCustom", name, params);
  if (window.ttq) window.ttq.track(name, params ?? {});
}
