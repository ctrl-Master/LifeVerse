// 工具：轻量 DOM 辅助
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const k in props) {
    if (k === 'class') node.className = props[k];
    else if (k === 'html') node.innerHTML = props[k];
    else if (k === 'text') node.textContent = props[k];
    else if (k.startsWith('on') && typeof props[k] === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), props[k]);
    } else if (k === 'style' && typeof props[k] === 'object') {
      Object.assign(node.style, props[k]);
    } else if (props[k] != null) {
      node.setAttribute(k, props[k]);
    }
  }
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
