// 前端HTML清理工具，用于安全地渲染生成的HTML代码

// 允许的HTML标签列表
const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'div', 'span', 'br', 'hr',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'form', 'input', 'textarea', 'button', 'select', 'option',
  'label', 'fieldset', 'legend',
  'a', 'img', 'video', 'audio',
  'strong', 'em', 'b', 'i', 'u', 's', 'code', 'pre',
  'blockquote', 'q', 'cite',
  'canvas', 'svg', 'g', 'path', 'circle', 'rect', 'line',
  'header', 'footer', 'nav', 'section', 'article', 'aside',
  'main', 'figure', 'figcaption', 'dialog'
]);

// 允许的HTML属性列表
const ALLOWED_ATTRS = new Set([
  'href', 'src', 'alt', 'title', 'width', 'height',
  'class', 'id', 'style',
  'type', 'value', 'placeholder', 'required', 'disabled', 'readonly',
  'name', 'for', 'selected', 'checked', 'max', 'min', 'step',
  'rows', 'cols', 'autocomplete',
  'role',
  'target', 'rel'
]);

// 允许的事件处理属性列表
const ALLOWED_EVENTS = new Set([
  'onclick', 'onchange', 'oninput', 'onsubmit', 'onreset', 'onkeydown'
]);

// 允许的CSS属性列表
const ALLOWED_CSS_PROPS = new Set([
  'display', 'position', 'top', 'right', 'bottom', 'left',
  'margin', 'padding', 'width', 'height', 'max-width', 'max-height',
  'color', 'background', 'background-color', 'border', 'border-radius',
  'font', 'font-size', 'font-family', 'font-weight', 'font-style',
  'text-align', 'text-decoration', 'text-transform', 'line-height',
  'opacity', 'visibility', 'z-index',
  'flex', 'flex-direction', 'justify-content', 'align-items',
  'grid', 'grid-template-columns', 'grid-template-rows',
  'box-shadow', 'transition', 'transform'
]);

// 检查URL是否安全
function isSafeUrl(url: string): boolean {
  if (!url) return false;
  
  // 允许的协议
  const allowedProtocols = ['http:', 'https:', 'ftp:', 'mailto:', 'tel:', 'sms:'];
  
  try {
    const parsedUrl = new URL(url);
    return allowedProtocols.includes(parsedUrl.protocol);
  } catch {
    // 如果不是标准URL格式，检查是否为相对路径
    return !url.startsWith('javascript:') && 
           !url.startsWith('vbscript:') && 
           !url.startsWith('data:text/javascript') &&
           !url.startsWith('data:text/html');
  }
}

// 清理CSS样式
function sanitizeCSS(css: string): string {
  if (!css) return '';
  
  return css.split(';')
    .map(declaration => {
      const [property, value] = declaration.split(':').map(part => part.trim());
      if (!property || !value) return '';
      
      // 检查属性是否在允许列表中
      if (ALLOWED_CSS_PROPS.has(property)) {
        // 检查值是否包含危险内容
        if (!value.includes('javascript:') && 
            !value.includes('expression(') && 
            !value.includes('url(javascript:')) {
          return `${property}: ${value}`;
        }
      }
      return '';
    })
    .filter(Boolean)
    .join('; ');
}

// 清理HTML内容
function sanitizeNode(node: Node): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    
    // 如果标签不在允许列表中，移除它
    if (!ALLOWED_TAGS.has(tagName)) {
      while (node.firstChild) {
        node.parentNode?.insertBefore(node.firstChild, node);
      }
      node.parentNode?.removeChild(node);
      return;
    }
    
    // 清理属性
    const attributes = Array.from(element.attributes);
    attributes.forEach(attr => {
      const attrName = attr.name.toLowerCase();
      const attrValue = attr.value;
      
      // 检查属性是否在允许列表中
      if (!ALLOWED_ATTRS.has(attrName) && !ALLOWED_EVENTS.has(attrName) && !attrName.startsWith('data-')) {
        element.removeAttribute(attr.name);
        return;
      }
      
      // 特殊处理href和src属性
      if (attrName === 'href' || attrName === 'src') {
        if (!isSafeUrl(attrValue)) {
          element.removeAttribute(attr.name);
        } else if (attrName === 'href') {
          // 添加noopener noreferrer到外部链接
          const isExternal = attrValue.startsWith('http');
          if (isExternal && tagName === 'a') {
            element.setAttribute('rel', 'noopener noreferrer');
          }
        }
      }
      
      // 清理style属性
      if (attrName === 'style') {
        const sanitizedStyle = sanitizeCSS(attrValue);
        if (sanitizedStyle) {
          element.setAttribute('style', sanitizedStyle);
        } else {
          element.removeAttribute('style');
        }
      }
    });
  }
  
  // 递归清理子节点
  let child = node.firstChild;
  while (child) {
    const nextChild = child.nextSibling;
    sanitizeNode(child);
    child = nextChild;
  }
}

// 清理HTML字符串
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  
  // 创建临时DOM元素
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // 清理所有节点
  sanitizeNode(tempDiv);
  
  // 返回清理后的HTML
  return tempDiv.innerHTML;
}

// 验证HTML内容是否安全
export function validateHTML(html: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // 检查危险标签
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      errors.push(`检测到危险标签: <${tagName}>`);
    }
    
    // 检查危险属性
    Array.from(element.attributes).forEach(attr => {
      const attrName = attr.name.toLowerCase();
      if (!ALLOWED_ATTRS.has(attrName) && 
          !ALLOWED_EVENTS.has(attrName) && 
          !attrName.startsWith('data-')) {
        errors.push(`检测到危险属性: ${attr.name}`);
      }
      
      // 检查危险URL
      if ((attrName === 'href' || attrName === 'src') && !isSafeUrl(attr.value)) {
        errors.push(`检测到危险URL: ${attr.value}`);
      }
    });
  });
  
  // 检查危险脚本
  if (html.includes('javascript:') || html.includes('vbscript:')) {
    errors.push('检测到危险的脚本协议');
  }
  
  if (html.includes('<script') || html.includes('</script>')) {
    errors.push('检测到危险的script标签');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}