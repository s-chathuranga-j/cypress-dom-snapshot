import {
  DOMSnapshot,
  IframeSnapshot,
  ShadowDomSnapshot,
  PageMetadata,
  SerializationOptions
} from '../plugin/types';
import { serializeWithStyles, getUniqueSelector } from './htmlSerializer';

export function captureFullDOM(
  options: SerializationOptions = {},
  doc?: Document,
  win?: Window
): DOMSnapshot {
  const timestamp = Date.now();
  const docToCapture = doc || document;
  const winToUse = win || window;
  const url = winToUse.location.href;

  const enrichedHTML = serializeWithStyles(docToCapture.documentElement, options, docToCapture, winToUse);

  const iframes =
    options.includeComputedStyles !== false ? captureIframes(docToCapture, options) : [];
  const shadowDoms =
    options.includeComputedStyles !== false ? captureShadowDom(docToCapture, options, docToCapture) : [];

  return {
    timestamp,
    url,
    html: enrichedHTML,
    iframes,
    shadowDoms,
    metadata: captureMetadata(docToCapture, winToUse)
  };
}

function captureIframes(rootDoc: Document, options: SerializationOptions): IframeSnapshot[] {
  const iframes = Array.from(rootDoc.querySelectorAll('iframe'));
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

function captureShadowDom(rootDoc: Document, options: SerializationOptions, doc: Document): ShadowDomSnapshot[] {
  const shadowHosts = findShadowHosts(rootDoc, doc);
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
      const container = doc.createElement('div');
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

function findShadowHosts(rootDoc: Document, doc: Document): Element[] {
  const root = rootDoc.body;
  if (!root) return [];

  const hosts: Element[] = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);

  let node: Node | null;
  while ((node = walker.nextNode())) {
    if ((node as Element).shadowRoot) {
      hosts.push(node as Element);
    }
  }
  return hosts;
}

function captureMetadata(doc: Document, win?: Window): PageMetadata {
  const winToUse = win || (doc.defaultView as Window | null) || window;

  return {
    pageTitle: doc.title,
    viewport: {
      width: winToUse.innerWidth,
      height: winToUse.innerHeight
    },
    scrollPosition: {
      x: winToUse.scrollX,
      y: winToUse.scrollY
    },
    externalStylesheets: Array.from(
      doc.querySelectorAll('link[rel=\"stylesheet\"]')
    ).map(link => (link as HTMLLinkElement).href)
  };
}
