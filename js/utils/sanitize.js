// XSS 防护：任何用户/外部来源的文本在插入 DOM 前先转义
export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 用 textContent 构建文本节点，避免 innerHTML 注入
export function textNode(tag, text, attrs = {}) {
  const node = document.createElement(tag);
  for (const key in attrs) {
    if (key === 'class') node.className = attrs[key];
    else if (key.startsWith('on') && typeof attrs[key] === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
    } else if (attrs[key] != null) {
      node.setAttribute(key, attrs[key]);
    }
  }
  node.textContent = escapeHtml(text);
  return node;
}
