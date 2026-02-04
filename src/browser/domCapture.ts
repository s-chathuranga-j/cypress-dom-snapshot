import { DOMSnapshot, IframeSnapshot, ShadowDomSnapshot, PageMetadata, SerializationOptions } from '../plugin/types';
import { serializeWithStyles, getUniqueSelector } from './htmlSerializer';

export function captureFullDOM(options: SerializationOptions = {}): DOMSnapshot {
  const timestamp = Date.now();
  const url = window.location.href;

  const enrichedHTML = serializeWithStyles(document.documentElement, options);

  const iframes = options.includeComputedStyles !== false ? captureIframes(options) : [];
  const shadowDoms = options.includeComputedStyles !== false ? captureShadowDom(options) : [];

  return {
    timestamp,
    url,
    html: enrichedHTML,
    iframes,
    shadowDoms,
    metadata: captureMetadata()
  };
}

function captureIframes(options: SerializationOptions): IframeSnapshot[] {
  const iframes = Array.from(document.querySelectorAll('iframe'));
  return iframes.map((iframe, index) => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        return {
          index,
          selector: getUniqueSelector(iframe),
          url: iframe.src,
          error: 'Iframe document not accessible'
        };
      }

      return {
        index,
        selector: getUniqueSelector(iframe),
        html: serializeWithStyles(doc.documentElement, options),
        url: iframe.src
      };
    } catch (e) {
      return {
        index,
        selector: getUniqueSelector(iframe),
        url: iframe.src,
        error: `Cross-origin iframe - content inaccessible: ${(e as Error).message}`
      };
    }
  });
}

function captureShadowDom(options: SerializationOptions): ShadowDomSnapshot[] {
  const shadowHosts = findShadowHosts(document.body);
  return shadowHosts.map(host => {
    const shadowRoot = host.shadowRoot;
    if (!shadowRoot) {
      return {
        hostSelector: getUniqueSelector(host),
        mode: 'closed',
        html: 'Shadow DOM inaccessible (closed mode)'
      };
    }

    try {
      const container = document.createElement('div');
      Array.from(shadowRoot.childNodes).forEach(node => {
        container.appendChild(node.cloneNode(true));
      });

      const html = serializeWithStyles(container, options);

      return {
        hostSelector: getUniqueSelector(host),
        mode: shadowRoot.mode || 'open',
        html
      };
    } catch (e) {
      return {
        hostSelector: getUniqueSelector(host),
        mode: shadowRoot.mode || 'unknown',
        html: `Error capturing shadow DOM: ${(e as Error).message}`
      };
    }
  });
}

function findShadowHosts(root: Element): Element[] {
  const hosts: Element[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if ((node as Element).shadowRoot) {
      hosts.push(node as Element);
    }
  }
  return hosts;
}

function captureMetadata(): PageMetadata {
  return {
    pageTitle: document.title,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    scrollPosition: {
      x: window.scrollX,
      y: window.scrollY
    },
    externalStylesheets: Array.from(
      document.querySelectorAll('link[rel="stylesheet"]')
    ).map(link => (link as HTMLLinkElement).href)
  };
}
