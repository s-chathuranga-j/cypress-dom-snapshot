/**
 * Cross-origin compatible DOM capture
 * This function accepts document and window parameters from cy.document() and cy.window()
 */

import {
  DOMSnapshot,
  IframeSnapshot,
  ShadowDomSnapshot,
  PageMetadata,
  SerializationOptions
} from '../plugin/types';
import { serializeWithStyles, getUniqueSelector } from './htmlSerializer';

/**
 * Capture DOM snapshot from the actual AUT document and window
 * Must be called with cy.document() and cy.window() results inside cy.origin()
 */
export function captureAUTDocument(
  doc: Document,
  win: Window,
  options: SerializationOptions = {}
): DOMSnapshot {
  const timestamp = Date.now();
  const url = win.location.href;

  const enrichedHTML = serializeWithStylesFromDoc(doc, win, doc.documentElement, options);

  const iframes =
    options.includeComputedStyles !== false ? captureIframesFromDoc(doc, win, options) : [];
  const shadowDoms =
    options.includeComputedStyles !== false ? captureShadowDomFromDoc(doc, win, options) : [];

  return {
    timestamp,
    url,
    html: enrichedHTML,
    iframes,
    shadowDoms,
    metadata: captureMetadataFromDoc(doc, win)
  };
}

function serializeWithStylesFromDoc(
  doc: Document,
  win: Window,
  root: HTMLElement,
  options: SerializationOptions = {}
): string {
  const {
    includeComputedStyles = true,
    includePseudoElements = false,
    propertiesToInclude = null
  } = options;

  const clone = root.cloneNode(true) as HTMLElement;

  if (includeComputedStyles) {
    inlineAllStylesFromDoc(doc, win, clone, root, propertiesToInclude);
  }

  if (includePseudoElements) {
    capturePseudoElementsFromDoc(doc, win, clone, root);
  }

  return clone.outerHTML;
}

function inlineAllStylesFromDoc(
  doc: Document,
  win: Window,
  cloneRoot: HTMLElement,
  originalRoot: HTMLElement,
  propertiesToInclude: string[] | null
): void {
  const cloneWalker = doc.createTreeWalker(cloneRoot, NodeFilter.SHOW_ELEMENT);
  const originalWalker = doc.createTreeWalker(originalRoot, NodeFilter.SHOW_ELEMENT);

  let cloneNode: Node | null;
  let originalNode: Node | null;

  while (
    (cloneNode = cloneWalker.nextNode()) &&
    (originalNode = originalWalker.nextNode())
  ) {
    if (cloneNode.nodeType === Node.ELEMENT_NODE) {
      const cloneEl = cloneNode as HTMLElement;
      const originalEl = originalNode as HTMLElement;

      const computed = win.getComputedStyle(originalEl);
      const inlineStyle: string[] = [];

      const properties = propertiesToInclude || Array.from(computed);

      properties.forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value) {
          inlineStyle.push(`${prop}: ${value}`);
        }
      });

      if (inlineStyle.length > 0) {
        cloneEl.setAttribute('style', inlineStyle.join('; '));
      }
    }
  }
}

function serializeComputedStyle(style: CSSStyleDeclaration): string {
  const props: string[] = [];
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    props.push(`${prop}: ${style.getPropertyValue(prop)}`);
  }
  return props.join('; ');
}

function capturePseudoElementsFromDoc(
  doc: Document,
  win: Window,
  cloneRoot: HTMLElement,
  originalRoot: HTMLElement
): void {
  const walker = doc.createTreeWalker(originalRoot, NodeFilter.SHOW_ELEMENT);

  let node: Node | null;
  const pseudoData: Array<{
    selector: string;
    before?: string;
    after?: string;
  }> = [];

  while ((node = walker.nextNode())) {
    const el = node as HTMLElement;
    const before = win.getComputedStyle(el, '::before');
    const after = win.getComputedStyle(el, '::after');

    const selector = getUniqueSelector(el);
    const data: any = { selector };

    if (before.content && before.content !== 'none') {
      data.before = serializeComputedStyle(before);
    }
    if (after.content && after.content !== 'none') {
      data.after = serializeComputedStyle(after);
    }

    if (data.before || data.after) {
      pseudoData.push(data);
    }
  }

  if (pseudoData.length > 0) {
    cloneRoot.setAttribute('data-pseudo-elements', JSON.stringify(pseudoData));
  }
}

function captureIframesFromDoc(
  doc: Document,
  win: Window,
  options: SerializationOptions
): IframeSnapshot[] {
  const iframes = Array.from(doc.querySelectorAll('iframe'));
  return iframes.map((iframe, index) => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
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
        html: serializeWithStylesFromDoc(doc, win, iframeDoc.documentElement, options),
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

function captureShadowDomFromDoc(
  doc: Document,
  win: Window,
  options: SerializationOptions
): ShadowDomSnapshot[] {
  function findShadowHosts(): Element[] {
    const root = doc.body;
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

  const shadowHosts = findShadowHosts();
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

      const html = serializeWithStylesFromDoc(doc, win, container, options);

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

function captureMetadataFromDoc(doc: Document, win: Window): PageMetadata {
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
      doc.querySelectorAll('link[rel="stylesheet"]')
    ).map(link => (link as HTMLLinkElement).href)
  };
}
