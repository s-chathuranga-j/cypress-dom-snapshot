import {
  DOMSnapshot,
  IframeSnapshot,
  ShadowDomSnapshot,
  PageMetadata,
  SerializationOptions
} from '../plugin/types';
import { serializeWithStyles, getUniqueSelector } from './htmlSerializer';

export function captureFullDOM(options: SerializationOptions = {}): DOMSnapshot {
  const timestamp = Date.now();
  const docToCapture = resolveAutDocument();

  const win = (docToCapture.defaultView as Window | null) || window;
  const url = win.location.href;

  const enrichedHTML = serializeWithStyles(docToCapture.documentElement, options);

  const iframes =
    options.includeComputedStyles !== false ? captureIframes(docToCapture, options) : [];
  const shadowDoms =
    options.includeComputedStyles !== false ? captureShadowDom(docToCapture, options) : [];

  return {
    timestamp,
    url,
    html: enrichedHTML,
    iframes,
    shadowDoms,
    metadata: captureMetadata(docToCapture)
  };
}

function resolveAutDocument(): Document {
  try {
    const currentWin = window as any as Window;
    const candidateWindows: Window[] = [currentWin];

    if (currentWin.parent && currentWin.parent !== currentWin) {
      candidateWindows.push(currentWin.parent);
    }
    if (currentWin.top && currentWin.top !== currentWin && currentWin.top !== currentWin.parent) {
      candidateWindows.push(currentWin.top);
    }

    for (const win of candidateWindows) {
      const doc = win.document;
      const autIframe = doc.querySelector(
        'iframe[data-cy=\"aut-iframe\"]'
      ) as HTMLIFrameElement | null;

      if (autIframe?.contentDocument) {
        return autIframe.contentDocument;
      }
    }
  } catch {
    // Fallback to current document when we can't safely inspect parent/top
  }

  return document;
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

function captureShadowDom(rootDoc: Document, options: SerializationOptions): ShadowDomSnapshot[] {
  const shadowHosts = findShadowHosts(rootDoc);
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

function findShadowHosts(rootDoc: Document): Element[] {
  const root = rootDoc.body;
  if (!root) return [];

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

function captureMetadata(doc: Document): PageMetadata {
  const win = (doc.defaultView as Window | null) || window;

  return {
    pageTitle: doc.title,
    viewport: {
      width: win.innerWidth,
      height: win.innerHeight
    },
    scrollPosition: {
      x: win.scrollX,
      y: win.scrollY
    },
    externalStylesheets: Array.from(
      doc.querySelectorAll('link[rel=\"stylesheet\"]')
    ).map(link => (link as HTMLLinkElement).href)
  };
}
