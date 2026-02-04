import { SerializationOptions } from '../plugin/types';

export function serializeWithStyles(
  root: HTMLElement,
  options: SerializationOptions = {},
  doc?: Document,
  win?: Window
): string {
  const {
    includeComputedStyles = true,
    includePseudoElements = false,
    propertiesToInclude = null
  } = options;

  const clone = root.cloneNode(true) as HTMLElement;
  const docToUse = doc || document;
  const winToUse = win || window;

  if (includeComputedStyles) {
    inlineAllStyles(clone, root, propertiesToInclude, docToUse, winToUse);
  }

  if (includePseudoElements) {
    capturePseudoElements(clone, root, docToUse, winToUse);
  }

  return clone.outerHTML;
}

function inlineAllStyles(
  cloneRoot: HTMLElement,
  originalRoot: HTMLElement,
  propertiesToInclude: string[] | null,
  doc: Document,
  win: Window
): void {
  const cloneWalker = doc.createTreeWalker(
    cloneRoot,
    NodeFilter.SHOW_ELEMENT
  );
  const originalWalker = doc.createTreeWalker(
    originalRoot,
    NodeFilter.SHOW_ELEMENT
  );

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

function capturePseudoElements(
  cloneRoot: HTMLElement,
  originalRoot: HTMLElement,
  doc: Document,
  win: Window
): void {
  const walker = doc.createTreeWalker(
    originalRoot,
    NodeFilter.SHOW_ELEMENT
  );

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
    cloneRoot.setAttribute(
      'data-pseudo-elements',
      JSON.stringify(pseudoData)
    );
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

export function getUniqueSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const path: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();
    const currentTagName = current.tagName;

    if (current.className) {
      const classes = Array.from(current.classList).join('.');
      if (classes) {
        selector += `.${classes}`;
      }
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(current);
      if (siblings.filter(s => s.tagName === currentTagName).length > 1) {
        selector += `:nth-child(${index + 1})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}
