const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'caption',
  'code',
  'col',
  'colgroup',
  'dd',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'iframe',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const ALLOWED_GLOBAL_ATTRIBUTES = new Set([
  'align',
  'alt',
  'aria-label',
  'colspan',
  'height',
  'rel',
  'rowspan',
  'target',
  'title',
  'width',
]);

const URL_ATTRIBUTES = new Set(['href', 'src']);
const BLOCKED_TAGS = /<\/?(script|style|meta|link|object|embed|form|input|button|textarea|select|option)[^>]*>/gi;

function isSafeUrl(value, tagName, attrName) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  if (raw.startsWith('/') || raw.startsWith('#')) return true;

  try {
    const url = new URL(raw, 'https://amztech.local');
    const protocol = url.protocol.toLowerCase();
    if (attrName === 'href') return ['http:', 'https:', 'mailto:', 'tel:'].includes(protocol);
    if (tagName === 'img' && protocol === 'data:') return raw.startsWith('data:image/');
    if (tagName === 'iframe') {
      return (
        protocol === 'https:' &&
        /(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$|(^|\.)youtu\.be$/.test(url.hostname)
      );
    }
    return ['http:', 'https:'].includes(protocol);
  } catch {
    return false;
  }
}

function sanitizeWithDomParser(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;

  const walk = (node) => {
    for (const child of [...node.children]) {
      const tagName = child.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tagName)) {
        child.replaceWith(...child.childNodes);
        continue;
      }

      for (const attr of [...child.attributes]) {
        const attrName = attr.name.toLowerCase();
        const allowed =
          ALLOWED_GLOBAL_ATTRIBUTES.has(attrName) ||
          URL_ATTRIBUTES.has(attrName);

        if (
          attrName.startsWith('on') ||
          attrName === 'style' ||
          !allowed ||
          (URL_ATTRIBUTES.has(attrName) && !isSafeUrl(attr.value, tagName, attrName))
        ) {
          child.removeAttribute(attr.name);
        }
      }

      if (tagName === 'a') {
        child.setAttribute('rel', 'noopener noreferrer');
        if (child.getAttribute('target') === '_blank') {
          child.setAttribute('target', '_blank');
        }
      }

      if (tagName === 'iframe') {
        child.setAttribute('loading', 'lazy');
        child.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      }

      walk(child);
    }
  };

  walk(root);
  return root.innerHTML;
}

export function stripHtml(value = '') {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function sanitizeHtml(value = '') {
  const html = String(value || '');
  if (!html) return '';

  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    return sanitizeWithDomParser(html);
  }

  return html
    .replace(BLOCKED_TAGS, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\sstyle\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:.*?\2/gi, '');
}
